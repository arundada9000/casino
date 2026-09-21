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
  WHEEL_SEGMENTS,
  WHEEL_TOTAL_WEIGHT,
  createWheelEngine,
  segmentStartAngle,
  spinRotation,
  type WheelEngine,
  type WheelResult,
  type WheelState,
} from "@/games/wheel";

import styles from "./wheel.module.css";

type Phase = "setup" | "spinning" | "over";

const SPIN_MS = 3_400;

export function WheelScreen({ engine }: { engine?: WheelEngine }) {
  const engineRef = useMemo(
    () => engine ?? createWheelEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<WheelState | null>(null);
  const [result, setResult] = useState<WheelResult | null>(null);
  const [angle, setAngle] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly WheelResult[]>([]);

  const spinning = phase === "spinning";
  const over = phase === "over";
  const overBalance = wager > balance;
  const canSpin = phase === "setup" && !overBalance;

  useEffect(() => {
    if (!spinning || round === null) return;
    const timer = window.setTimeout(() => {
      setPhase("over");
      if (result && result.payout > result.wager) {
        feedback("win");
      }
    }, SPIN_MS + 40);
    return () => window.clearTimeout(timer);
  }, [spinning, round, result]);

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function spin() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const ctx = { gameId: "wheel" as const, roundId, startedAt: Date.now() };

    try {
      bet(wager, { ...ctx, note: "Wheel spin" });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: WheelState;
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

    const outcome = engineRef.finishRound(ctx, state);
    try {
      award(outcome.payout, {
        gameId: "wheel",
        roundId,
        note: `Wheel ${outcome.multiplier.toFixed(1)}x`,
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

    setAngle(spinRotation(angle, state.segment));
    setRound(state);
    setResult(outcome);
    setHistory((current) => [outcome, ...current].slice(0, 12));
    setNotice(null);
    setPhase("spinning");
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
    const won = history.filter((item) => item.payout > item.wager).length;
    const net = history.reduce((sum, item) => sum + item.payout - item.wager, 0);
    return { played, won, net };
  }, [history]);

  const segments = WHEEL_SEGMENTS.map((segment, index) => ({
    ...segment,
    index,
    start: segmentStartAngle(index),
  }));

  usePrimaryActionKey(over ? newRound : spin, !over && !canSpin);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Wheel</LargeTitle>
      <p className={styles.subtitle}>Spin the wheel of multipliers and bank the wedge it stops on.</p>

      <section className={styles.arena} aria-label="Wheel">
        <div className={styles.arenaHeader}>
          <span className={styles.arenaBrand}>Wheel</span>
          <span className={styles.arenaTag}>
            {spinning ? "Spinning..." : over ? "Stopped" : "1% house edge"}
          </span>
        </div>

        <div className={styles.wheelWrap}>
          <span className={styles.pointer} aria-hidden />
          <div
            className={styles.wheel}
            style={{
              background: `conic-gradient(from 0deg, ${segments
                .map(
                  (segment, index) =>
                    `${stylesColor(index)} ${segment.start}deg ${index === segments.length - 1 ? 360 : segments[index + 1]?.start ?? 0}deg`,
                )
                .join(", ")})`,
              transform: `rotate(${angle}deg)`,
              transitionDuration: spinning ? `${SPIN_MS}ms` : over ? "min(0.8s, 400ms)" : "0ms",
            }}
            role="img"
            aria-label="Wheel of multipliers"
          >
            {segments.map((segment) => (
              <span
                key={segment.index}
                className={styles.label}
                style={{ transform: `rotate(${segment.start + (segment.weight / WHEEL_TOTAL_WEIGHT) * 180}deg) translateY(-38%)` }}
              >
                {segment.multiplier === 0 ? "0" : `${segment.multiplier.toFixed(0)}x`}
              </span>
            ))}
            <span className={styles.hub} aria-hidden />
          </div>
        </div>

        {over && result && (
          <div className={styles.result} data-win={result.payout > 0 || undefined} role="status">
            <div className={styles.resultTitle}>
              {result.payout > 0 ? "Landed a payout" : "Landed on zero"}
            </div>
            <div className={styles.resultLine}>
              {result.payout > 0 ? `+${formatCredits(result.payout)} cr` : "0 cr"}
            </div>
            <div className={styles.resultDetail}>
              {result.multiplier.toFixed(1)}x · {result.payout > 0 ? `spent ${formatCredits(result.wager)} cr` : `${formatCredits(result.wager)} cr stays with the house`}
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
          <h2 className={styles.sectionTitle}>Segments</h2>
          <span className={styles.limit}>by arc share</span>
        </div>
        <ul className={styles.odds}>
          {segments.map((segment) => (
            <li key={segment.index}>
              <span className={styles.swatch} data-mult={segment.multiplier} aria-hidden />
              <span className={styles.oddsMult}>
                {segment.multiplier === 0 ? "0x" : `${segment.multiplier.toFixed(0)}x`}
              </span>
              <span className={styles.oddsChance}>
                {(segment.weight / WHEEL_TOTAL_WEIGHT) * 100}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.actions}>
        {phase === "setup" && (
          <Button
            variant="primary"
            size="lg"
            disabled={!canSpin}
            onClick={spin}
            feedbackEvent="bet"
          >
            Spin
          </Button>
        )}
        {spinning && (
          <Button variant="secondary" size="lg" disabled>
            Spinning...
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
                  title={`${item.multiplier.toFixed(1)}x · ${formatCredits(item.payout, { signed: true })}`}
                >
                  {item.multiplier === 0 ? "0" : `${item.multiplier.toFixed(0)}x`}
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

function stylesColor(index: number): string {
  switch (index) {
    case 0:
      return "#3a3f4d";
    case 1:
      return "#8a5cf6";
    case 2:
      return "#2ec4b6";
    case 3:
      return "#f4a93c";
    default:
      return "#3a3f4d";
  }
}