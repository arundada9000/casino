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
import {
  MAX_ROWS,
  ROW_OPTIONS,
  createPlinkoEngine,
  multiplierFor,
  type PlinkoEngine,
  type PlinkoResult,
  type PlinkoState,
} from "@/games/plinko";

import styles from "./plinko.module.css";

type Phase = "setup" | "playing" | "over";

const STEP_MS = 150;

export function PlinkoScreen({ engine }: { engine?: PlinkoEngine }) {
  const engineRef = useMemo(
    () => engine ?? createPlinkoEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [rows, setRows] = useState(12);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<PlinkoState | null>(null);
  const [result, setResult] = useState<PlinkoResult | null>(null);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly PlinkoResult[]>([]);

  const playing = phase === "playing";
  const over = phase === "over";
  const overBalance = wager > balance;
  const canDrop = phase === "setup" && !overBalance;

  useEffect(() => {
    if (!playing || round === null) return;
    const timer = window.setTimeout(
      () => {
        const next = step + 1;
        if (next >= round.rows) {
          setStep(round.rows);
          setPhase("over");
          if (result && result.payout > result.wager) {
            feedback("win");
          }
          return;
        }
        setStep(next);
      },
      STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playing, step, round, result]);

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function pickRows(value: number) {
    feedback("select");
    setRows(value);
  }

  function drop() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const ctx = { gameId: "plinko" as const, roundId, startedAt: Date.now() };

    try {
      bet(wager, { ...ctx, note: "Plinko drop" });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: PlinkoState;
    try {
      state = engineRef.beginRound(ctx, { wager, rows });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, {
        ...ctx,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    const outcome = engineRef.finishRound(ctx, state);
    try {
      award(outcome.payout, {
        gameId: "plinko",
        roundId,
        note: `Plinko ${outcome.multiplier.toFixed(2)}x`,
      });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, {
        ...ctx,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      setRound(state);
      setResult(outcome);
      setPhase("over");
      return;
    }

    setRound(state);
    setResult(outcome);
    setHistory((current) => [outcome, ...current].slice(0, 12));
    setStep(0);
    setNotice(null);
    setPhase("playing");
  }

  function newRound() {
    feedback("select");
    setRound(null);
    setResult(null);
    setNotice(null);
    setStep(0);
    setPhase("setup");
  }

  const stats = useMemo(() => {
    const played = history.length;
    const won = history.filter((item) => item.payout > item.wager).length;
    const net = history.reduce((sum, item) => sum + item.payout - item.wager, 0);
    return { played, won, net };
  }, [history]);

  const spacing = 100 / rows;
  const ballColumn = useMemo(() => {
    if (round === null) return 0;
    let column = 0;
    for (let i = 0; i < Math.min(step, round.path.length); i += 1) {
      if (round.path[i]) column += 1;
    }
    return column;
  }, [round, step]);

  const ballX = (ballColumn + (step % 2 === 1 ? 0.5 : 0)) * spacing;
  const ballY = step * spacing;

  usePrimaryActionKey(over ? newRound : drop, !over && !canDrop);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Plinko</LargeTitle>
      <p className={styles.subtitle}>Drop the ball through the pegs and bank the slot it lands in.</p>

      <section className={styles.arena} aria-label="Peg field">
        <div className={styles.arenaHeader}>
          <span className={styles.arenaBrand}>Plinko</span>
          <span className={styles.arenaTag}>
            {over
              ? "Landed"
              : playing
                ? `${rows} rows · dropping`
                : `${rows} rows · ${rows + 1} slots`}
          </span>
        </div>

        <div className={styles.stage} style={{ aspectRatio: "10 / 13" }}>
          <div className={styles.field}>
            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: rows + 1 }, (_, col) => (
                <span
                  key={`${row}-${col}`}
                  className={styles.peg}
                  style={{
                    left: `${(col + (row % 2 === 1 ? 0.5 : 0)) * spacing}%`,
                    top: `${(row + 0.5) * spacing}%`,
                  }}
                  aria-hidden
                />
              )),
            )}
            {playing || over ? (
              <span
                className={styles.ball}
                style={{
                  transform: `translate3d(${ballX}%, ${ballY}%, 0)`,
                  transitionDuration: playing ? `${STEP_MS}ms` : "0ms",
                }}
                aria-hidden
              />
            ) : null}
          </div>
          <div className={styles.lanes}>
            {Array.from({ length: rows + 1 }, (_, slot) => (
              <span
                key={slot}
                className={styles.lane}
                data-active={over && result?.slot === slot || undefined}
              >
                {multiplierFor(rows, slot).toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        {over && result && (
          <div className={styles.result} data-profit={result.payout > result.wager || undefined} role="status">
            <div className={styles.resultTitle}>
              {result.payout > result.wager ? "Landed a payout" : "Bounced in"}
            </div>
            <div className={styles.resultLine}>
              {result.payout > result.wager ? `+${formatCredits(result.payout)} cr` : `${formatCredits(result.payout)} cr`}
            </div>
            <div className={styles.resultDetail}>
              Slot {result.slot + 1} of {result.rows + 1} · {result.multiplier.toFixed(2)}x
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
      </section>

      <section className={styles.section} aria-label="Board size">
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>Board</h2>
          <span className={styles.limit}>
            {Math.min(...ROW_OPTIONS)} - {MAX_ROWS} rows
          </span>
        </div>
        <div className={styles.rowPicks}>
          {ROW_OPTIONS.map((option) => (
            <button
              key={option}
              className={styles.rowPick}
              data-active={rows === option}
              onClick={() => pickRows(option)}
              type="button"
              disabled={phase !== "setup"}
            >
              {option}
            </button>
          ))}
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
        {phase === "setup" && (
          <Button
            variant="primary"
            size="lg"
            disabled={!canDrop}
            onClick={drop}
            feedbackEvent="bet"
          >
            Drop
          </Button>
        )}
        {playing && (
          <Button variant="secondary" size="lg" disabled>
            Dropping...
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
                  data-profit={item.payout > item.wager || undefined}
                  title={`Slot ${item.slot + 1} · ${item.multiplier.toFixed(2)}x · ${formatCredits(item.payout, { signed: true })}`}
                >
                  {item.slot + 1}
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