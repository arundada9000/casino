"use client";

import { useEffect, useMemo, useState } from "react";
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
import { isRed, type Card } from "@/games/blackjack";
import {
  HOUSE_EDGE,
  REMAINING,
  createHiLoEngine,
  multiplierFor,
  remainingCards,
  type HiLoEngine,
  type HiLoState,
  type HiLoPrediction,
  type HiLoResult,
} from "@/games/hi-lo";

import styles from "./hi-lo.module.css";

type Phase = "setup" | "choice" | "reveal" | "over";

const REVEAL_MS = 900;

const SUIT_GLYPH: Record<Card["suit"], string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

const CALLS: readonly { key: HiLoPrediction; label: string }[] = [
  { key: "higher", label: "Higher" },
  { key: "lower", label: "Lower" },
  { key: "equal", label: "Equal" },
];

export function HiLoScreen({ engine }: { engine?: HiLoEngine }) {
  const engineRef = useMemo(
    () => engine ?? createHiLoEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<HiLoState | null>(null);
  const [result, setResult] = useState<HiLoResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly HiLoResult[]>([]);

  const revealed = phase === "reveal" || phase === "over";
  const over = phase === "over";
  const overBalance = wager > balance;
  const canDeal = phase === "setup" && !overBalance;

  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = window.setTimeout(() => {
      setPhase("over");
      if (result && result.payout > 0) {
        feedback("win");
      } else if (result) {
        feedback("loss");
      }
    }, REVEAL_MS + 60);
    return () => window.clearTimeout(timer);
  }, [phase, result]);

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function deal() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const ctx = { gameId: "hi-lo" as const, roundId, startedAt: Date.now() };

    try {
      bet(wager, { ...ctx, note: "Hi-Lo deal" });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: HiLoState;
    try {
      state = engineRef.beginRound(ctx, { wager });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, {
        ...ctx,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    setRound(state);
    setResult(null);
    setNotice(null);
    setPhase("choice");
  }

  function call(prediction: HiLoPrediction) {
    if (phase !== "choice" || round === null) return;
    let made: HiLoState;
    try {
      made = engineRef.call(round, prediction);
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    const ctx = {
      gameId: "hi-lo" as const,
      roundId: made.roundId,
      startedAt: made.startedAt,
    };
    let outcome: HiLoResult;
    try {
      outcome = engineRef.finishRound(ctx, made);
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    try {
      award(outcome.payout, {
        gameId: "hi-lo",
        roundId: made.roundId,
        note: outcome.payout > 0
          ? `Hi-Lo ${callLabel(prediction)} ${outcome.multiplier.toFixed(2)}x`
          : "Hi-Lo miss",
      });
    } catch (error) {
      useEconomyStore.getState().returnCredits(made.wager, {
        ...ctx,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    setRound(made);
    setResult(outcome);
    setHistory((current) => [outcome, ...current].slice(0, 12));
    setNotice(null);
    setPhase("reveal");
  }

  function newRound() {
    feedback("select");
    setRound(null);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  const stats = useMemo(() => {
    const played = history.length;
    const won = history.filter((item) => item.payout > 0).length;
    const net = history.reduce((sum, item) => sum + item.payout - item.wager, 0);
    return { played, won, net };
  }, [history]);

  usePrimaryActionKey(over ? newRound : deal, !over && !canDeal);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Hi-Lo</LargeTitle>
      <p className={styles.subtitle}>Guess whether the next card runs higher, lower, or equal.</p>

      <section className={styles.arena} aria-label="Hi-Lo table">
        <div className={styles.arenaHeader}>
          <span className={styles.arenaBrand}>Hi-Lo</span>
          <span className={styles.arenaTag}>
            {phase === "choice"
              ? "Pick a side"
              : revealed && result
                ? result.payout > 0
                  ? "Correct"
                  : "Miss"
                : `${HOUSE_EDGE * 100}% house edge`}
          </span>
        </div>

        <div className={styles.cards}>
          {round ? (
            <>
              <CardVisual card={round.topCard} faceUp />
              <span className={styles.vs}>vs</span>
              <CardVisual card={round.revealCard} faceUp={revealed} folded />
            </>
          ) : (
            <div className={styles.placeholder} aria-hidden>
              <CardVisual card={null} faceUp={false} />
            </div>
          )}
        </div>

        {phase === "choice" && round && (
          <div className={styles.calls} role="group" aria-label="Predict the next card">
            {CALLS.map((callDef) => {
              const multiplier = multiplierFor(callDef.key, round.topCard.rank);
              const remaining = remainingCards(callDef.key, round.topCard.rank);
              const impossible = multiplier === 0;
              return (
                <button
                  key={callDef.key}
                  className={styles.call}
                  data-impossible={impossible}
                  onClick={() => call(callDef.key)}
                  type="button"
                  disabled={impossible}
                >
                  <span className={styles.callLabel}>{callDef.label}</span>
                  <span className={styles.callOdds}>
                    {impossible ? "No cards" : `${multiplier.toFixed(2)}x`}
                  </span>
                  <span className={styles.callCount}>
                    {remaining} of {REMAINING} cards
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {over && result && (
          <div className={styles.result} data-win={result.payout > 0 || undefined} role="status">
            <div className={styles.resultTitle}>
              {result.payout > 0 ? "Your call was right" : "The house takes it"}
            </div>
            <div className={styles.resultLine}>
              {result.payout > 0
                ? `+${formatCredits(result.payout)} cr`
                : `${formatCredits(result.wager)} cr`}
            </div>
            <div className={styles.resultDetail}>
              {result.prediction} {callGlyph(result.prediction)} {result.multiplier.toFixed(2)}x
              {result.payout > 0 ? "" : " · nothing banked"}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section} aria-label="Bet">
        <div className={styles.balanceRow}>
          <span>Balance</span>
          <strong>{formatCredits(balance)}</strong>
        </div>
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>Wager</h2>
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
            disabled={phase !== "setup" || wager <= MIN_BET}
          >
            -
          </button>
          <div className={styles.wager}>{formatCredits(wager)}</div>
          <button
            className={styles.step}
            onClick={() => nudge(BET_STEP)}
            aria-label="Increase wager"
            type="button"
            disabled={phase !== "setup" || wager >= MAX_BET}
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
              disabled={phase !== "setup"}
            >
              {formatCredits(preset)}
            </button>
          ))}
          <button
            className={styles.chip}
            data-active={wager === MIN_BET}
            onClick={() => setBetAmount(MIN_BET)}
            type="button"
            disabled={phase !== "setup"}
          >
            Min
          </button>
          <button
            className={styles.chip}
            data-active={wager === MAX_BET ? true : undefined}
            onClick={() => setBetAmount(MAX_BET)}
            type="button"
            disabled={phase !== "setup"}
          >
            Max
          </button>
        </div>
        {overBalance ? (
          <p className={styles.notice} role="alert">
            Not enough credits to cover this bet.
          </p>
        ) : null}
        {notice ? (
          <p className={styles.notice} role="alert">
            {notice}
          </p>
        ) : null}
      </section>

      <section className={styles.section} aria-label="Odds">
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>How it pays</h2>
          <span className={styles.limit}>vs the current card</span>
        </div>
        <ul className={styles.odds}>
          <li>
            <span className={styles.oddsMult}>Higher</span>
            <span className={styles.oddsChance}>impossible over an Ace</span>
          </li>
          <li>
            <span className={styles.oddsMult}>Lower</span>
            <span className={styles.oddsChance}>impossible under a Two</span>
          </li>
          <li>
            <span className={styles.oddsMult}>Equal</span>
            <span className={styles.oddsChance}>long shot near 17x</span>
          </li>
        </ul>
      </section>

      <div className={styles.actions}>
        {phase === "setup" && (
          <Button
            variant="primary"
            size="lg"
            disabled={!canDeal}
            onClick={deal}
            feedbackEvent="bet"
          >
            Deal
          </Button>
        )}
        {phase === "choice" && (
          <Button variant="secondary" size="lg" disabled>
            Pick Higher, Lower, or Equal
          </Button>
        )}
        {phase === "reveal" && (
          <Button variant="secondary" size="lg" disabled>
            Revealing...
          </Button>
        )}
        {over && (
          <Button variant="primary" size="lg" onClick={newRound}>
            New round
          </Button>
        )}
      </div>

      {over && (
        <section className={styles.history} aria-label="Round history">
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
                  data-win={item.payout > 0 || undefined}
                  title={`${item.topCard.rank} vs ${item.revealCard.rank} · ${item.prediction} · ${formatCredits(item.payout, { signed: true })}`}
                >
                  {item.topCard.rank}
                  {callGlyph(item.prediction)}
                  {item.revealCard.rank}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.limit}>No rounds played yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

function CardVisual({
  card,
  faceUp,
  folded,
}: {
  card: Card | null;
  faceUp: boolean;
  folded?: boolean;
}) {
  if (card === null) {
    return <div className={`${styles.card} ${styles.cardBack}`} aria-hidden />;
  }
  if (folded) {
    return (
      <div
        className={`${styles.card} ${styles.cardFold}`}
        data-facedown={!faceUp}
        aria-label={faceUp ? `${card.rank} of ${card.suit}` : "Hidden card"}
      >
        <span className={styles.cardFoldedFace} data-red={isRed(card)}>
          <span className={styles.cardRank}>{card.rank}</span>
          <span className={styles.cardSuit}>{SUIT_GLYPH[card.suit]}</span>
          <span className={styles.cardPip}>{SUIT_GLYPH[card.suit]}</span>
        </span>
        <span className={styles.cardFoldedBack} aria-hidden />
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

function callLabel(prediction: HiLoPrediction): string {
  switch (prediction) {
    case "higher":
      return "Higher";
    case "lower":
      return "Lower";
    case "equal":
      return "Equal";
  }
}

function callGlyph(prediction: HiLoPrediction): string {
  switch (prediction) {
    case "higher":
      return ">";
    case "lower":
      return "<";
    case "equal":
      return "=";
  }
}