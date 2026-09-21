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
  DICE_TOTALS,
  LOW_HIGH_MULTIPLIER,
  createDiceEngine,
  exactMultiplier,
  type DiceEngine,
  type DicePrediction,
  type DiceResult,
  type DiceTotal,
  type DiceValue,
} from "@/games/dice";

import styles from "./dice.module.css";

type Phase = "setup" | "rolling" | "revealed";

const ROLL_MS = 1750;

/** [x, y] rotation that brings a die face to the front. */
const FACING: Record<DiceValue, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 180 },
};

const FACE_POSE: Record<DiceValue, string> = {
  1: "rotateY(0deg) translateZ(var(--die-half))",
  2: "rotateX(90deg) translateZ(var(--die-half))",
  3: "rotateY(90deg) translateZ(var(--die-half))",
  4: "rotateY(-90deg) translateZ(var(--die-half))",
  5: "rotateX(-90deg) translateZ(var(--die-half))",
  6: "rotateY(180deg) translateZ(var(--die-half))",
};

/** Pip positions on a 3x3 grid, row-major. */
const PIPS: Record<DiceValue, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function predictionLabel(prediction: DicePrediction): string {
  if (prediction === "under") return "Under 7";
  if (prediction === "over") return "Over 7";
  return `Exact ${prediction.total}`;
}

function rollLine(result: DiceResult): string {
  return `${result.die1} + ${result.die2} = ${result.total}`;
}

function DieFace({ value }: { value: DiceValue }) {
  return (
    <div className={styles.dieFace} style={{ transform: FACE_POSE[value] }} aria-hidden>
      <div className={styles.pipGrid}>
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            className={styles.pipCell}
            data-pip={PIPS[value].includes(index) || undefined}
          />
        ))}
      </div>
    </div>
  );
}

function Die({ value, rolling, index }: { value: DiceValue; rolling: boolean; index: number }) {
  const facing = FACING[value];
  const extraX = index === 0 ? 0 : 1620;
  const extraY = index === 0 ? 1620 : 0;
  const duration = index === 0 ? "1500ms" : "1750ms";
  const transform = rolling
    ? `rotateX(${facing.x + extraX}deg) rotateY(${facing.y + extraY}deg)`
    : `rotateX(${facing.x}deg) rotateY(${facing.y}deg)`;
  return (
    <div
      className={styles.dieStage}
      aria-label={rolling ? "Die is rolling" : `Die shows ${value}`}
    >
      <div
        className={styles.die}
        style={{
          transform,
          transitionDuration: rolling ? "0ms" : duration,
        }}
      >
        {(Object.keys(FACE_POSE) as unknown as DiceValue[]).map((faceValue) => (
          <DieFace key={faceValue} value={faceValue} />
        ))}
      </div>
    </div>
  );
}

export function DiceScreen({ engine }: { engine?: DiceEngine }) {
  const engineRef = useMemo(
    () => engine ?? createDiceEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [prediction, setPrediction] = useState<DicePrediction | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<DiceResult | null>(null);
  const [history, setHistory] = useState<readonly DiceResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const rolling = phase === "rolling";
  const revealed = phase === "revealed";
  const overBalance = wager > balance;
  const canRoll = prediction !== null && phase === "setup" && !overBalance;

  const die1 = result?.die1 ?? 1;
  const die2 = result?.die2 ?? 1;

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function pick(predictionValue: DicePrediction) {
    feedback("select");
    setPrediction(predictionValue);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function roll() {
    if (phase !== "setup" || prediction === null || overBalance) return;
    const roundId = newId();
    const startedAt = Date.now();
    const ctx = { gameId: "dice" as const, roundId, startedAt };

    try {
      bet(wager, { ...ctx, note: `Dice ${predictionLabel(prediction)}` });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state;
    try {
      state = engineRef.beginRound(ctx, { wager, prediction });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let outcome: DiceResult;
    try {
      outcome = engineRef.finishRound(ctx, state);
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    if (outcome.payout > 0) {
      try {
        award(outcome.payout, {
          ...ctx,
          note: `Dice win · ${outcome.multiplier}x`,
        });
      } catch (error) {
        useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
        setNotice(errorMessage(error));
        feedback("error");
        return;
      }
    }

    setResult(outcome);
    setNotice(null);
    setPhase("rolling");
    window.setTimeout(() => {
      setPhase("revealed");
      setHistory((current) => [outcome, ...current].slice(0, 12));
      feedback(outcome.payout > 0 ? "win" : "loss");
    }, ROLL_MS);
  }

  function newRound() {
    feedback("select");
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

  usePrimaryActionKey(revealed ? newRound : roll, !revealed && !canRoll);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Dice</LargeTitle>
      <p className={styles.subtitle}>Two fair dice. Call under or over seven, or name the exact total.</p>

      <section className={styles.arena} aria-label="Dice pit">
        <div className={styles.pitHeader}>
          <span className={styles.pitBrand}>Dice</span>
          <span className={styles.pitTag}>Under 7 · Over 7 · Exact</span>
        </div>

        <div className={styles.diceTray}>
          <Die value={die1} rolling={rolling} index={0} />
          <span className={styles.diceSign}>+</span>
          <Die value={die2} rolling={rolling} index={1} />
          <span className={styles.diceSign}>=</span>
          <div className={styles.totalDie} aria-hidden>
            <span className={styles.totalLabel}>Total</span>
            <strong>{result ? result.total : "-"}</strong>
          </div>
        </div>

        <p className={styles.caption} aria-live="polite">
          {rolling
            ? "Rolling..."
            : result
              ? rollLine(result)
              : prediction
                ? `Calling ${predictionLabel(prediction)}.`
                : "Pick a call, then roll."}
        </p>

        {revealed && result && (
          <div className={styles.result} data-outcome={result.outcome} role="status">
            <div className={styles.resultTitle}>
              {result.outcome === "win" ? "You win" : "You lose"}
            </div>
            {result.payout > 0 && (
              <div className={styles.resultLine}>+{formatCredits(result.payout)} cr</div>
            )}
            <div className={styles.resultDetail}>
              {predictionLabel(result.prediction)} · {rollLine(result)} ·{" "}
              {result.payout > 0 ? `pays ${result.multiplier}x` : `${formatCredits(result.wager)} cr`}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section} aria-label="Call">
        <h2 className={styles.sectionTitle}>Call</h2>
        <div className={styles.calls}>
          {(["under", "over"] as const).map((side) => (
            <button
              key={side}
              type="button"
              className={styles.call}
              data-active={prediction === side || undefined}
              disabled={rolling}
              onClick={() => pick(side)}
            >
              <span className={styles.callName}>
                {side === "under" ? "Under 7" : "Over 7"}
              </span>
              <span className={styles.callOdds}>
                {side === "under" ? "Rolls 2-6" : "Rolls 8-12"} · {LOW_HIGH_MULTIPLIER}:1
              </span>
            </button>
          ))}
        </div>
        <div className={styles.exactHeader}>
          <span className={styles.sectionTitle}>Exact total</span>
          <span className={styles.limit}>pays up to {exactMultiplier(2)}x</span>
        </div>
        <div className={styles.exact} role="radiogroup">
          {DICE_TOTALS.map((total) => (
            <button
              key={total}
              type="button"
              role="radio"
              aria-checked={prediction !== null && typeof prediction === "object" && prediction.total === total}
              className={styles.exactChip}
              data-active={prediction !== null && typeof prediction === "object" && prediction.total === total}
              disabled={rolling}
              onClick={() => pick({ total })}
            >
              <span className={styles.exactTotal}>{total}</span>
              <span className={styles.exactOdds}>x{exactMultiplier(total)}</span>
            </button>
          ))}
        </div>
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
            disabled={rolling || wager <= MIN_BET}
          >
            -
          </button>
          <div className={styles.wager}>{formatCredits(wager)}</div>
          <button
            className={styles.step}
            onClick={() => nudge(BET_STEP)}
            aria-label="Increase wager"
            type="button"
            disabled={rolling || wager >= MAX_BET}
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
              disabled={rolling}
            >
              {formatCredits(preset)}
            </button>
          ))}
          <button
            className={styles.chip}
            data-active={wager === MIN_BET}
            onClick={() => setBetAmount(MIN_BET)}
            type="button"
            disabled={rolling}
          >
            Min
          </button>
          <button
            className={styles.chip}
            data-active={wager === MAX_BET ? true : undefined}
            onClick={() => setBetAmount(MAX_BET)}
            type="button"
            disabled={rolling}
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

      <div className={styles.actions}>
        {revealed ? (
          <Button variant="primary" size="lg" onClick={newRound}>
            New round
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!canRoll}
            onClick={roll}
            feedbackEvent="bet"
          >
            {rolling ? "Rolling..." : "Roll"}
          </Button>
        )}
      </div>

      {revealed && (
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
                  data-outcome={item.outcome}
                  title={`${item.outcome} ${item.payout - item.wager >= 0 ? "+" : ""}${formatCredits(
                    item.payout - item.wager,
                    { signed: true },
                  )} · ${rollLine(item)}`}
                >
                  {item.payout > 0 ? "W" : "L"}
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