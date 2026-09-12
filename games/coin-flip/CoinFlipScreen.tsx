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
  COIN_FLIP_MS,
  COIN_FLIP_MULTIPLIER,
  COIN_SIDES,
  createCoinFlipEngine,
  type CoinFlipEngine,
  type CoinFlipResult,
  type CoinSide,
} from "@/games/coin-flip";

import styles from "./coin-flip.module.css";

type Phase = "setup" | "spinning" | "revealed";

export function CoinFlipScreen({ engine }: { engine?: CoinFlipEngine }) {
  const engineRef = useMemo(
    () => engine ?? createCoinFlipEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [picked, setPicked] = useState<CoinSide | null>(null);
  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<CoinFlipResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const spinning = phase === "spinning";
  const revealed = phase === "revealed";
  const overBalance = wager > balance;
  const canFlip =
    picked !== null &&
    phase === "setup" &&
    wager >= MIN_BET &&
    wager <= MAX_BET &&
    !overBalance;

  function selectSide(side: CoinSide) {
    feedback("select");
    setPicked(picked === side ? null : side);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function flip() {
    if (spinning || picked === null) return;
    const roundId = newId();
    const startedAt = Date.now();

    let state;
    try {
      bet(wager, { gameId: "coin-flip", roundId, note: `Flipping ${picked}` });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    try {
      state = engineRef.beginRound(
        { gameId: "coin-flip", roundId, startedAt },
        { wager, picked },
      );
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, {
        gameId: "coin-flip",
        roundId,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    const outcome = engineRef.finishRound(
      { gameId: "coin-flip", roundId, startedAt },
      state,
    );

    if (outcome.outcome === "win") {
      try {
        award(outcome.payout, {
          gameId: "coin-flip",
          roundId,
          note: `${outcome.side} came up`,
        });
      } catch (error) {
        useEconomyStore.getState().returnCredits(wager, {
          gameId: "coin-flip",
          roundId,
          note: "Round refunded",
        });
        setNotice(errorMessage(error));
        feedback("error");
        return;
      }
    }

    feedback("bet");
    setResult(outcome);
    setNotice(null);
    setPhase("spinning");
    window.setTimeout(() => {
      setPhase("revealed");
      feedback(outcome.outcome === "win" ? "win" : "loss");
    }, COIN_FLIP_MS);
  }

  function newRound() {
    feedback("select");
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  const rotation = result !== null ? (result.side === "heads" ? 1800 : 1980) : 0;

  usePrimaryActionKey(revealed ? newRound : flip, !revealed && !canFlip);

  return (
    <div className={styles.page}>
      <Link href="/games" className={styles.back}>
        <ChevronLeftIcon size={18} />
        Games
      </Link>
      <LargeTitle subtitle={`Even money. Picks pay ${COIN_FLIP_MULTIPLIER}x your bet.`}>
        Coin Flip
      </LargeTitle>

      <section className={styles.section} aria-label="Flips">
        <div className={styles.balance}>
          Balance <strong>{formatCredits(balance)} cr</strong>
        </div>

        <div className={styles.coinArea} aria-hidden={result === null ? undefined : true}>
          <div className={styles.coin} data-behind={!(phase === "setup") || undefined}>
            <div className={styles.faces} style={{ transform: `rotateY(${rotation}deg)` }}>
              <div className={styles.face} data-side="heads">
                <span className={styles.faceMark}>H</span>
                <span className={styles.faceName}>Heads</span>
              </div>
              <div className={styles.face} data-side="tails">
                <span className={styles.faceMark}>T</span>
                <span className={styles.faceName}>Tails</span>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.coinCaption}>
          {revealed && result
            ? `It landed on ${result.side}.`
            : picked
              ? `Calling ${picked}.`
              : "Pick heads or tails."}
        </p>
      </section>

      <section className={styles.section} aria-label="Pick a side">
        <h2 className={styles.sectionTitle}>Side</h2>
        <div className={styles.sides} role="radiogroup">
          {COIN_SIDES.map((side) => (
            <button
              key={side}
              type="button"
              role="radio"
              aria-checked={picked === side}
              className={styles.side}
              data-active={picked === side || undefined}
              disabled={spinning}
              onClick={() => selectSide(side)}
            >
              <span className={styles.sideMark}>{side === "heads" ? "H" : "T"}</span>
              <span className={styles.sideName}>{side}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Bet">
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>Bet</h2>
          <span className={styles.limit}>
            {MIN_BET} to {formatCredits(MAX_BET)} cr
          </span>
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.step}
            aria-label="Decrease bet"
            disabled={spinning || wager <= MIN_BET}
            onClick={() => nudge(-BET_STEP)}
          >
            −
          </button>
          <output className={styles.wager} aria-live="polite">
            {formatCredits(wager)} cr
          </output>
          <button
            type="button"
            className={styles.step}
            aria-label="Increase bet"
            disabled={spinning || wager >= MAX_BET}
            onClick={() => nudge(BET_STEP)}
          >
            +
          </button>
        </div>
        <div className={styles.chips}>
          {BET_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles.chip}
              data-active={wager === preset || undefined}
              disabled={spinning}
              onClick={() => setBetAmount(preset)}
            >
              {formatCredits(preset)}
            </button>
          ))}
          <button
            type="button"
            className={styles.chip}
            data-active={wager === MIN_BET || undefined}
            disabled={spinning}
            onClick={() => setBetAmount(MIN_BET)}
          >
            Min
          </button>
          <button
            type="button"
            className={styles.chip}
            data-active={wager === MAX_BET ? true : undefined}
            disabled={spinning}
            onClick={() => setBetAmount(MAX_BET)}
          >
            Max
          </button>
        </div>
        {overBalance ? (
          <p className={styles.notice} data-kind="error" role="alert">
            Not enough credits to cover this bet.
          </p>
        ) : null}
        {notice ? (
          <p className={styles.notice} data-kind="error" role="alert">
            {notice}
          </p>
        ) : null}
      </section>

      {revealed && result ? (
        <div className={styles.result} data-outcome={result.outcome} role="status" aria-label="Round result">
          <p className={styles.resultTitle}>
            {result.outcome === "win" ? "You win" : "You lose"}
          </p>
          <p className={styles.resultLine}>
            {result.outcome === "win"
              ? `+${formatCredits(result.payout)} cr`
              : `−${formatCredits(result.wager)} cr`}
          </p>
          <p className={styles.resultDetail}>
            {result.outcome === "win" ? "Payout" : "Stake"} · {result.wager} cr ·{" "}
            {result.side}
          </p>
        </div>
      ) : null}

      <div className={styles.actions}>
        {revealed ? (
          <Button variant="primary" size="lg" onClick={newRound}>
            New round
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!canFlip}
            onClick={flip}
            feedbackEvent="bet"
          >
            {spinning ? "Flipping..." : "Flip"}
          </Button>
        )}
      </div>
    </div>
  );
}