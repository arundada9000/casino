"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  createCrashEngine,
  multiplierAt,
  roundMultiplier,
  type CrashEngine,
  type CrashResult,
  type CrashState,
} from "@/games/crash";

import styles from "./crash.module.css";

type Phase = "setup" | "climbing" | "crashed" | "revealed";

const TICK_MS = 50;

export function CrashScreen({ engine }: { engine?: CrashEngine }) {
  const engineRef = useMemo(
    () => engine ?? createCrashEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<CrashState | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const [result, setResult] = useState<CrashResult | null>(null);
  const [history, setHistory] = useState<readonly CrashResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const tickRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const climbing = phase === "climbing";
  const overBalance = wager > balance;
  const canStart = phase === "setup" && !overBalance;
  const crashed = phase === "crashed" || result?.outcome === "crash";
  const won = result?.outcome === "win";

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => stopTicking, [stopTicking]);

  function startRound() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const startedAt = Date.now();
    const ctx = { gameId: "crash" as const, roundId, startedAt };

    try {
      bet(wager, { ...ctx, note: "Crash ride" });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: CrashState;
    try {
      state = engineRef.beginRound(ctx, { wager });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    setRound(state);
    setResult(null);
    setNotice(null);
    setLive(1);
    startRef.current = performance.now();
    setPhase("climbing");
    tickRef.current = window.setInterval(() => {
      const m = multiplierAt(performance.now() - startRef.current);
      if (roundMultiplier(m) >= state.crashPoint) {
        stopTicking();
        setLive(state.crashPoint);
        setPhase("crashed");
        setHistory((current) => [engineRef.crashed(state), ...current].slice(0, 12));
        feedback("loss");
        window.setTimeout(() => setPhase("revealed"), 650);
        return;
      }
      setLive(m);
    }, TICK_MS);
  }

  function cashOut() {
    if (phase !== "climbing" || round === null || live === null) return;
    stopTicking();
    const multiplier = roundMultiplier(live);
    let outcome: CrashResult;
    try {
      outcome = engineRef.cashOut(round, multiplier);
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    if (outcome.outcome !== "win") {
      setLive(round.crashPoint);
      setPhase("crashed");
      setHistory((current) => [outcome, ...current].slice(0, 12));
      feedback("loss");
      window.setTimeout(() => setPhase("revealed"), 650);
      return;
    }
    try {
      award(outcome.payout, {
        gameId: "crash",
        roundId: round.roundId,
        note: `Crash cash-out ${outcome.multiplier.toFixed(2)}x`,
      });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, {
        gameId: "crash",
        roundId: round.roundId,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      setResult(outcome);
      setHistory((current) => [outcome, ...current].slice(0, 12));
      setPhase("revealed");
      return;
    }
    setResult(outcome);
    setHistory((current) => [outcome, ...current].slice(0, 12));
    setPhase("revealed");
    feedback("win");
  }

  function newRound() {
    feedback("select");
    setRound(null);
    setResult(null);
    setLive(null);
    setNotice(null);
    setPhase("setup");
  }

  const stats = useMemo(() => {
    const played = history.length;
    const wonCount = history.filter((item) => item.payout > 0).length;
    const net = history.reduce((sum, item) => sum + item.payout - item.wager, 0);
    return { played, won: wonCount, net };
  }, [history]);

  const gone = phase === "crashed" || phase === "revealed";
  const display = live ?? (result ? result.multiplier : 1);
  const readoutValue = crashed
    ? `${(round?.crashPoint ?? result?.crashPoint ?? 1).toFixed(2)}x`
    : won
      ? `${result.multiplier.toFixed(2)}x`
      : `${display.toFixed(2)}x`;
  const progress =
    round && round.crashPoint > 1
      ? Math.min(1, Math.max(0, (display - 1) / (round.crashPoint - 1)))
      : 1;

  usePrimaryActionKey(
    climbing ? cashOut : gone ? newRound : startRound,
    !climbing && !gone && !canStart,
  );

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Crash</LargeTitle>
      <p className={styles.subtitle}>The multiplier climbs. Cash out before the bus crashes.</p>

      <section className={styles.arena} aria-label="Crash lane">
        <div className={styles.arenaHeader}>
          <span className={styles.arenaBrand}>Crash</span>
          <span className={styles.arenaTag}>Cash out or crash</span>
        </div>

        <div className={styles.readout} role="status" aria-live="polite">
          <span className={styles.readoutValue} data-crash={crashed || dataWinFlag(won)}>
            {readoutValue}
          </span>
          <span className={styles.readoutHint} data-crash={crashed || dataWinFlag(won)}>
            {phase === "setup"
              ? "Waiting for a ride."
              : crashed
                ? "Crashed"
                : won
                  ? "Cashed out"
                  : `Riding at ${round ? formatCredits(round.wager) : ""} cr`}
          </span>
        </div>

        <div className={styles.gauge} aria-hidden>
          <div
            className={styles.gaugeFill}
            data-crash={crashed || undefined}
            data-win={won || undefined}
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        {result && gone && result.outcome === "win" && (
          <div className={styles.result} data-outcome="win" role="status">
            <div className={styles.resultTitle}>Cashed out</div>
            <div className={styles.resultLine}>
              +{formatCredits(result.payout)} cr
            </div>
            <div className={styles.resultDetail}>
              {result.multiplier.toFixed(2)}x · {formatCredits(result.wager)} cr out before the crash
            </div>
          </div>
        )}

        {result && gone && result.outcome === "crash" && (
          <div className={styles.result} data-outcome="crash" role="status">
            <div className={styles.resultTitle}>Crashed</div>
            <div className={styles.resultLine} data-crash>
              {result.crashPoint.toFixed(2)}x
            </div>
            <div className={styles.resultDetail}>
              {formatCredits(result.wager)} cr stays with the house
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

      <div className={styles.actions}>
        {phase === "setup" && (
          <Button
            variant="primary"
            size="lg"
            disabled={!canStart}
            onClick={startRound}
            feedbackEvent="bet"
          >
            Start
          </Button>
        )}
        {climbing && (
          <Button
            variant="primary"
            size="lg"
            className={styles.cashOut}
            onClick={cashOut}
            feedbackEvent="select"
          >
            Cash out {live ? `at ${live.toFixed(2)}x` : ""}
          </Button>
        )}
        {gone && (
          <Button variant="primary" size="lg" onClick={newRound}>
            New round
          </Button>
        )}
      </div>

      {gone && (
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
                  title={
                    item.cashedOut
                      ? `Cashed out ${item.multiplier.toFixed(2)}x · ${formatCredits(item.payout, { signed: true })}`
                      : `Crashed at ${item.multiplier.toFixed(2)}x · ${formatCredits(item.wager)} cr`
                  }
                >
                  {item.cashedOut ? "W" : "C"}
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

function dataWinFlag(won: boolean): boolean | undefined {
  return won || undefined;
}