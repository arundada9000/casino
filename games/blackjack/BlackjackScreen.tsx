"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Button } from "@/components/ui/Button";
import { usePrimaryActionKey } from "@/hooks/usePrimaryActionKey";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { feedback } from "@/lib/app-feedback";
import { errorMessage } from "@/core/error";
import { formatCredits } from "@/lib/format";
import { newId } from "@/lib/id";
import {
  BET_PRESETS,
  BET_STEP,
  MAX_BET,
  MIN_BET,
  clampWager,
} from "@/core/game-engine";
import { createRng } from "@/core/randomness";
import {
  BLACKJACK_REVEAL_MS,
  createBlackjackEngine,
  handValue,
  isBust,
  isRed,
  type BlackjackEngine,
  type BlackjackResult,
  type BlackjackState,
  type Card,
} from "@/games/blackjack";

import styles from "./blackjack.module.css";

type Phase = "setup" | "playing" | "dealer" | "revealed";

const SUIT_GLYPH: Record<Card["suit"], string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

function CardFace({
  card,
  folded,
  faceUp,
}: {
  card: Card;
  /** Render as a reversible card (the dealer hole card). */
  folded?: boolean;
  /** When folded, the face is turned up. */
  faceUp?: boolean;
}) {
  if (folded) {
    return (
<div className={`${styles.card} ${styles.cardFold}`} data-facedown={!faceUp} aria-label={faceUp ? `${card.rank} of ${card.suit}` : "Hole card"}>
      <span className={styles.cardFoldedFace} data-red={isRed(card)}>
        <span className={styles.cardRank}>{card.rank}</span>
        <span className={styles.cardSuit}>{SUIT_GLYPH[card.suit]}</span>
        <span className={styles.cardPip}>{SUIT_GLYPH[card.suit]}</span>
      </span>
      <span className={styles.cardFoldedBack} aria-hidden />
      <span className={styles.cardFoldedShadow} aria-hidden />
    </div>
    );
  }
  return (
    <div className={styles.card} data-red={isRed(card)}>
      <span className={styles.cardRank}>{card.rank}</span>
      <span className={styles.cardSuit}>{SUIT_GLYPH[card.suit]}</span>
      <span className={styles.cardPip}>{SUIT_GLYPH[card.suit]}</span>
    </div>
  );
}

export function BlackjackScreen({ engine }: { engine?: BlackjackEngine }) {
  const engineRef = useMemo(
    () => engine ?? createBlackjackEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<BlackjackState | null>(null);
  const [result, setResult] = useState<BlackjackResult | null>(null);
  const [history, setHistory] = useState<readonly BlackjackResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const playing = phase === "playing";
  const overBalance = wager > balance;
  const canDeal = phase === "setup" && !overBalance;

  const active =
    playing && round ? (round.hands[round.activeHand] ?? null) : null;
  const canHit = playing && active !== null && !active.done;
  const canStand = playing && active !== null && !active.done;
  const canDouble =
    playing &&
    active !== null &&
    active.cards.length === 2 &&
    !active.done &&
    !active.doubled &&
    active.bet * 2 <= balance;
  const canSplit =
    playing &&
    round !== null &&
    round.hands.length === 1 &&
    active !== null &&
    active.cards.length === 2 &&
    active.cards[0]?.rank === active.cards[1]?.rank &&
    !active.done &&
    active.bet * 2 <= balance;

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function betExtra(amount: number, note: string): boolean {
    const next = round;
    if (!next) return false;
    const ctx = { gameId: "blackjack" as const, roundId: next.roundId, startedAt: next.startedAt };
    try {
      bet(amount, { ...ctx, note });
      return true;
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return false;
    }
  }

  function deal() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const startedAt = Date.now();
    const ctx = { gameId: "blackjack" as const, roundId, startedAt };

    try {
      bet(wager, { ...ctx, note: `Blackjack ${wager.toLocaleString()}` });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: BlackjackState;
    try {
      state = engineRef.beginRound(ctx, { wager });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    feedback("bet");
    setRound(state);
    setResult(null);
    setNotice(null);
    if (state.hands[0]?.done) {
      settleRound(state);
    } else {
      setPhase("playing");
    }
  }

  function settleRound(next: BlackjackState) {
    const ctx = { gameId: "blackjack" as const, roundId: next.roundId, startedAt: next.startedAt };
    let outcome: BlackjackResult;
    try {
      outcome = engineRef.finishRound(ctx, next);
    } catch (error) {
      useEconomyStore.getState().returnCredits(next.stake, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    try {
      if (outcome.winPayout > 0) {
        award(outcome.winPayout, {
          ...ctx,
          note: outcome.outcome === "win" ? "Blackjack payout" : "Partial payout",
        });
      }
      if (outcome.pushRefund > 0) {
        useEconomyStore.getState().returnCredits(outcome.pushRefund, {
          ...ctx,
          note: "Round returned",
        });
      }
    } catch (error) {
      useEconomyStore.getState().returnCredits(next.stake, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    setRound(next);
    setPhase("dealer");
    window.setTimeout(() => {
      setResult(outcome);
      setPhase("revealed");
      setHistory((current) => [outcome, ...current].slice(0, 12));
      feedback(outcome.winPayout > 0 ? "win" : "loss");
    }, BLACKJACK_REVEAL_MS);
  }

  function act(mutate: () => BlackjackState) {
    if (!round || phase !== "playing") return;
    let next: BlackjackState;
    try {
      next = mutate();
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    feedback("tap");
    setNotice(null);
    setRound(next);
    if (next.hands.every((hand) => hand.done)) {
      settleRound(next);
    }
  }

  function hit() {
    act(() =>
      engineRef.hit(
        { gameId: "blackjack", roundId: round!.roundId, startedAt: round!.startedAt },
        round!,
      ),
    );
  }

  function stand() {
    act(() =>
      engineRef.stand(
        { gameId: "blackjack", roundId: round!.roundId, startedAt: round!.startedAt },
        round!,
      ),
    );
  }

  function doubleDown() {
    if (!round || !active) return;
    if (active.bet * 2 > balance) return;
    if (!betExtra(active.bet, "Double down")) return;
    act(() =>
      engineRef.double(
        { gameId: "blackjack", roundId: round.roundId, startedAt: round.startedAt },
        round,
      ),
    );
  }

  function splitPair() {
    if (!round || !active) return;
    if (active.bet * 2 > balance) return;
    if (!betExtra(active.bet, "Split pair")) return;
    act(() =>
      engineRef.split(
        { gameId: "blackjack", roundId: round.roundId, startedAt: round.startedAt },
        round,
      ),
    );
  }

  function endRoundEarly() {
    if (!round || phase !== "playing") return;
    useEconomyStore.getState().returnCredits(round.stake, {
      gameId: "blackjack",
      roundId: round.roundId,
      note: "Round closed",
    });
    feedback("select");
    setRound(null);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function newRound() {
    feedback("select");
    setRound(null);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  const showDealerTotal =
    phase === "dealer" || phase === "revealed" || phase === "setup";
  const dealerTotal = round && showDealerTotal ? handValue(round.dealer).total : 0;
  const dealerBust = round ? isBust(round.dealer) : false;

  const stats = useMemo(() => {
    const played = history.length;
    const won = history.filter((item) => item.winPayout > 0).length;
    const net = history.reduce(
      (sum, item) => sum + item.winPayout + item.pushRefund - item.stake,
      0,
    );
    return { played, won, net };
  }, [history]);

  usePrimaryActionKey(
    phase === "revealed" ? newRound : deal,
    phase !== "revealed" && !canDeal,
  );

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Blackjack</LargeTitle>
      <p className={styles.subtitle}>Beat the dealer. Natural blackjack pays 3 to 2.</p>

      <section className={styles.table} aria-label="Blackjack table">
        <div className={styles.rowLabel}>Dealer</div>
        {round ? (
          <div className={styles.cards}>
            {round.dealer.map((card, index) => (
              <CardFace key={index} card={card} folded={index === 1} faceUp={phase !== "playing"} />
            ))}
            {phase === "playing" && round.dealer[0] ? (
              <span className={styles.totalBadge} data-live aria-label="Dealer visible total">
                {handValue([round.dealer[0]]).total}
              </span>
            ) : null}
            {(phase === "dealer" || phase === "revealed") && (
              <span className={styles.totalBadge} data-bust={dealerBust}>
                {dealerTotal}
              </span>
            )}
          </div>
        ) : (
          <div className={styles.cardsPlaceholder} aria-hidden>
            <div className={styles.card} data-back />
            <div className={styles.card} data-back />
          </div>
        )}

        <div className={styles.rowGap} />

        <div className={styles.rowLabel}>You</div>
        {round ? (
          <>
            <div className={styles.hands}>
              {round.hands.map((hand, index) => {
                const total = handValue(hand.cards).total;
                const bust = isBust(hand.cards);
                const isActive = index === round.activeHand && phase === "playing";
                return (
                  <div className={styles.hand} key={index} data-active={isActive}>
                    <div className={styles.handLabel}>
                      {round.hands.length > 1 ? `Hand ${index + 1}` : "Hand"}
                      {hand.doubled ? (
                        <span className={styles.handTag}>Double</span>
                      ) : null}
                      {formatCredits(hand.bet, { signed: false })}
                    </div>
                    <div className={styles.cards}>
                      {hand.cards.map((card, cardIndex) => (
                        <CardFace key={cardIndex} card={card} />
                      ))}
                      <span className={styles.totalBadge} data-bust={bust}>
                        {total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {playing && (
              <div className={styles.actions}>
                <div className={styles.actionRow}>
                  <Button variant="primary" onClick={hit} disabled={!canHit}>
                    Hit
                  </Button>
                  <Button variant="secondary" onClick={stand} disabled={!canStand}>
                    Stand
                  </Button>
                </div>
                {(canDouble || canSplit) && (
                  <div className={styles.actionRow} data-ghost>
                    <Button variant="ghost" onClick={doubleDown} disabled={!canDouble}>
                      Double
                    </Button>
                    <Button variant="ghost" onClick={splitPair} disabled={!canSplit}>
                      Split
                    </Button>
                  </div>
                )}
              </div>
            )}

            {playing && (
              <button className={styles.quit} onClick={endRoundEarly} type="button">
                End round, return {formatCredits(round.stake, { signed: false })}
              </button>
            )}

            {phase === "dealer" && (
              <p className={styles.dealerBusy} aria-live="polite">
                Dealer is playing...
              </p>
            )}
          </>
        ) : (
          <div className={styles.setup} aria-label="Place your bet">
            <div className={styles.balanceRow}>
              <span>Balance</span>
              <strong>{formatCredits(balance)}</strong>
            </div>
            <div className={styles.stepperHeader}>
              <span className={styles.sectionTitle}>Wager per hand</span>
              <span className={styles.limit}>
                {MIN_BET.toLocaleString()} - {MAX_BET.toLocaleString()}
              </span>
            </div>
            <div className={styles.stepper}>
              <button
                className={styles.step}
                onClick={() => nudge(-BET_STEP)}
                aria-label="Decrease wager"
                type="button"
              >
                -
              </button>
              <div className={styles.wager}>{formatCredits(wager)}</div>
              <button
                className={styles.step}
                onClick={() => nudge(BET_STEP)}
                aria-label="Increase wager"
                type="button"
              >
                +
              </button>
            </div>
            <div className={styles.chips}>
              {BET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  className={styles.chip}
                  data-active={wager === preset}
                  onClick={() => setBetAmount(preset)}
                  type="button"
                >
                  {formatCredits(preset)}
                </button>
              ))}
            </div>
            <div className={styles.deal}>
              <Button variant="primary" onClick={deal} disabled={!canDeal}>
                Deal
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <p className={styles.notice} data-kind="error" role="alert">
            {notice}
          </p>
        )}

        {result && phase === "revealed" && (
          <div className={styles.result} data-outcome={result.outcome} role="status">
            <div className={styles.resultTitle}>
              {result.outcome === "win"
                ? result.blackjack
                  ? "Blackjack!"
                  : "Win"
                : result.outcome === "push"
                  ? "Push"
                  : "House wins"}
            </div>
            {result.winPayout > 0 && (
              <div className={styles.resultLine}>
                +{formatCredits(result.winPayout)}
              </div>
            )}
            <div className={styles.resultDetail}>
              {result.pushRefund > 0
                ? `Returned ${formatCredits(result.pushRefund)}`
                : result.outcome === "push"
                  ? `${formatCredits(result.stake)} returned`
                  : `${formatCredits(result.stake)} wagered`}
            </div>
            <div className={styles.resultActions}>
              <Button variant="primary" onClick={newRound}>
                New round
              </Button>
            </div>
          </div>
        )}

        {phase === "revealed" && (
          <div className={styles.history} aria-label="Round history">
            <div className={styles.historyHeader}>
              <span className={styles.sectionTitle}>History</span>
              <span className={styles.limit}>
                Played {stats.played} · Won {stats.won} ·{" "}
                {formatCredits(stats.net, { signed: true })}
              </span>
            </div>
            {history.length > 0 ? (
              <div className={styles.historyRow}>
                {history.slice(0, 12).map((item, index) => (
                  <span
                    key={index}
                    className={styles.outcomeTile}
                    data-outcome={item.outcome}
                    title={`${item.outcome} ${item.winPayout > 0 ? "+" : ""}${formatCredits(
                      item.winPayout + item.pushRefund - item.stake,
                      { signed: true },
                    )}`}
                  >
                    {item.outcome === "win" ? "W" : item.outcome === "push" ? "P" : "L"}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.limit}>No rounds played yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}