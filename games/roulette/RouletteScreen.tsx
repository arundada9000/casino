"use client";

import { useMemo, useState, type CSSProperties } from "react";
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
import { BET_PRESETS, BET_STEP, MAX_BET, MIN_BET, clampWager } from "@/core/game-engine";
import { createRng } from "@/core/randomness";
import {
  ROULETTE_NUMBERS,
  ROULETTE_SPIN_MS,
  betZoneKey,
  createRouletteEngine,
  rouletteColor,
  type RouletteBet,
  type RouletteBetKind,
  type RouletteEngine,
  type RouletteResult,
} from "@/games/roulette";

import styles from "./roulette.module.css";

type Phase = "setup" | "spinning" | "revealed";

interface Zone {
  kind: RouletteBetKind;
  target: number | null;
}

const ZEROS: readonly number[] = [0];

const DOZEN_ZONES: readonly Zone[] = [
  { kind: "dozen", target: 1 },
  { kind: "dozen", target: 2 },
  { kind: "dozen", target: 3 },
];

const COLUMN_ZONES: readonly Zone[] = [
  { kind: "column", target: 1 },
  { kind: "column", target: 2 },
  { kind: "column", target: 3 },
];

const EVEN_ZONES: readonly Zone[] = [
  { kind: "low", target: null },
  { kind: "even", target: null },
  { kind: "red", target: null },
  { kind: "black", target: null },
  { kind: "odd", target: null },
  { kind: "high", target: null },
];

function zoneLabel(zone: Zone): string {
  if (zone.kind === "straight") return "number";
  return zone.kind.replace(/[a-z][A-Z]/g, (m) => `${m[0]} ${m[1]}`);
}

const ORDINALS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

function dozenLabel(target: number): string {
  return `${ORDINALS[target]} 12`;
}

function now(): number {
  return Date.now();
}

function numberPosition(n: number): { row: number; col: number } {
  if (n === 0) return { row: 1, col: 1 };
  return { row: Math.floor((n - 1) / 3) + 1, col: ((n - 1) % 3) + 2 };
}

export function RouletteScreen({ engine }: { engine?: RouletteEngine }) {
  const engineRef = useMemo(
    () => engine ?? createRouletteEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [bets, setBets] = useState<readonly RouletteBet[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [history, setHistory] = useState<readonly RouletteResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const spinning = phase === "spinning";
  const revealed = phase === "revealed";
  const totalWager = bets.reduce((sum, item) => sum + item.wager, 0);

  const zonesByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of bets) {
      const key = betZoneKey(item);
      map.set(key, (map.get(key) ?? 0) + item.wager);
    }
    return map;
  }, [bets]);

  const winningsByKey = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!result) return map;
    for (const outcome of result.bets) {
      if (outcome.paid) map.set(betZoneKey(outcome.bet), true);
    }
    return map;
  }, [result]);

  function zoneKey(zone: Zone): string {
    return `${zone.kind}:${zone.target ?? ""}`;
  }

  function placeOn(zone: Zone) {
    if (spinning) return;
    feedback("select");
    setBets((current) => [
      ...current,
      { id: newId(), kind: zone.kind, target: zone.target, wager },
    ]);
    setResult(null);
    setNotice(null);
    if (phase !== "setup") setPhase("setup");
  }

  function undoLast() {
    if (spinning) return;
    feedback("select");
    setBets((current) => current.slice(0, -1));
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function clearAll() {
    if (spinning) return;
    feedback("select");
    setBets([]);
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function spin() {
    if (spinning || bets.length === 0) return;
    const roundId = newId();
    const startedAt = now();

    try {
      bet(totalWager, {
        gameId: "roulette",
        roundId,
        note: `Spinning ${bets.length} ${bets.length === 1 ? "bet" : "bets"}`,
      });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state;
    try {
      state = engineRef.beginRound(
        { gameId: "roulette", roundId, startedAt },
        { bets },
      );
    } catch (error) {
      useEconomyStore.getState().returnCredits(totalWager, {
        gameId: "roulette",
        roundId,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    const outcome = engineRef.finishRound(
      { gameId: "roulette", roundId, startedAt },
      state,
    );

    if (outcome.totalPayout > 0) {
      try {
        award(outcome.totalPayout, {
          gameId: "roulette",
          roundId,
          note: `Ball landed on ${outcome.number}`,
        });
      } catch (error) {
        useEconomyStore.getState().returnCredits(totalWager, {
          gameId: "roulette",
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
      setHistory((current) => [outcome, ...current].slice(0, 12));
      feedback(outcome.totalPayout > 0 ? "win" : "loss");
    }, ROULETTE_SPIN_MS);
  }

  function newRound() {
    feedback("select");
    setResult(null);
    setNotice(null);
    setPhase("setup");
  }

  const canSpin = bets.length > 0 && phase === "setup" && balance >= totalWager;

  usePrimaryActionKey(revealed ? newRound : spin, !revealed && !canSpin);

  return (
    <div className={styles.page}>
      <Link href="/games" className={styles.back}>
        <ChevronLeftIcon size={18} />
        Games
      </Link>
      <LargeTitle subtitle="European wheel, single zero, payouts of 36x, 3x, and 2x.">
        Roulette
      </LargeTitle>

      <section className={styles.section} aria-label="Wheel">
        <div className={styles.balance}>
          Balance <strong>{formatCredits(balance)} cr</strong>
        </div>
        <div className={styles.wheelArea}>
          <div className={styles.wheel} data-spinning={spinning || undefined}>
            <div className={styles.rim} aria-hidden="true" />
            <div className={styles.face}>
              <div className={styles.pockets} aria-hidden="true" />
              <div className={styles.zero} aria-hidden="true" />
            </div>
            <div className={styles.hubRing} aria-hidden="true" />
            <div className={styles.ballTrack}>
              <span className={styles.ball} aria-hidden="true" />
            </div>
            <div
              className={styles.wheelHub}
              data-color={revealed && result ? result.color : undefined}
              aria-hidden="true"
            >
              {revealed && result ? result.number : "0"}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-label="Bet size">
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>Chip</h2>
          <span className={styles.limit}>
            {MIN_BET} to {formatCredits(MAX_BET)} cr
          </span>
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.step}
            aria-label="Decrease chip"
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
            aria-label="Increase chip"
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
            data-active={wager === MAX_BET || undefined}
            disabled={spinning}
            onClick={() => setBetAmount(MAX_BET)}
          >
            Max
          </button>
        </div>
        <div className={styles.betActions}>
          <Button variant="ghost" size="md" disabled={spinning || bets.length === 0} onClick={undoLast}>
            Undo last
          </Button>
          <Button variant="ghost" size="md" disabled={spinning || bets.length === 0} onClick={clearAll}>
            Clear bets
          </Button>
        </div>
      </section>

      <section className={styles.section} aria-label="Table">
        <div className={styles.table}>
          <div className={styles.board}>
            {ZEROS.map((n) => (
              <BoardCell
                key={zoneKey({ kind: "straight", target: n })}
                label={String(n)}
                variant="zero"
                total={zonesByKey.get(zoneKey({ kind: "straight", target: n }))}
                winning={winningsByKey.get(zoneKey({ kind: "straight", target: n }))}
                spinning={spinning}
                onPlace={() => placeOn({ kind: "straight", target: n })}
                styleAttr={{
                  gridRowStart: 1,
                  gridRowEnd: 4,
                  gridColumnStart: 1,
                  gridColumnEnd: 2,
                }}
              />
            ))}
            {ROULETTE_NUMBERS.filter((n) => n > 0).map((n) => {
              const pos = numberPosition(n);
              return (
                <BoardCell
                  key={n}
                  label={String(n)}
                  variant={rouletteColor(n)}
                  total={zonesByKey.get(zoneKey({ kind: "straight", target: n }))}
                  winning={winningsByKey.get(zoneKey({ kind: "straight", target: n }))}
                  spinning={spinning}
                  onPlace={() => placeOn({ kind: "straight", target: n })}
                  styleAttr={{ gridRow: pos.row, gridColumn: pos.col }}
                />
              );
            })}
            {COLUMN_ZONES.map((zone, index) => (
              <BoardCell
                key={zoneKey(zone)}
                label="2:1"
                variant="outline"
                total={zonesByKey.get(zoneKey(zone))}
                winning={winningsByKey.get(zoneKey(zone))}
                spinning={spinning}
                onPlace={() => placeOn(zone)}
                styleAttr={{ gridRow: index + 1, gridColumn: 14 }}
                srText={`Column ${zone.target} pays 2 to 1`}
              />
            ))}
            {DOZEN_ZONES.map((zone, index) => (
              <BoardCell
                key={zoneKey(zone)}
                label={dozenLabel(zone.target ?? 0)}
                variant="outline"
                total={zonesByKey.get(zoneKey(zone))}
                winning={winningsByKey.get(zoneKey(zone))}
                spinning={spinning}
                onPlace={() => placeOn(zone)}
                styleAttr={{ gridRow: 4, gridColumnStart: 2 + index * 4, gridColumnEnd: 6 + index * 4 }}
                srText={`Dozen ${zone.target} pays 2 to 1`}
              />
            ))}
            <div className={styles.evenRow} style={{ gridRow: 5, gridColumnStart: 1, gridColumnEnd: 15 }}>
              {EVEN_ZONES.map((zone) => (
                <BoardCell
                  key={zoneLabel(zone)}
                  label={EVEN_LABELS[zoneKey(zone)] ?? zoneLabel(zone)}
                  variant={EVEN_VARIANT[zoneKey(zone)] ?? "outline"}
                  total={zonesByKey.get(zoneKey(zone))}
                  winning={winningsByKey.get(zoneKey(zone))}
                  spinning={spinning}
                  onPlace={() => placeOn(zone)}
                  srText={`${zoneLabel(zone)} pays even money`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className={styles.stake}>
          {bets.length === 0
            ? "Tap the table to place a chip."
            : `${bets.length} ${bets.length === 1 ? "chip" : "chips"} · ${formatCredits(totalWager)} cr total`}
        </p>
      </section>

      {notice ? (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      ) : null}

      {revealed && result ? (
        <div className={styles.result} data-outcome={result.totalPayout > 0 ? "win" : "loss"} role="status" aria-label="Round result">
          <p className={styles.resultTitle}>
            {result.totalPayout > 0 ? "You win" : "No match"}
          </p>
          <p className={styles.resultLine}>
            Ball stopped on <strong>{result.number}</strong>
          </p>
          <p className={styles.resultPayout}>
            {result.totalPayout > 0
              ? `+${formatCredits(result.totalPayout)} cr`
              : `−${formatCredits(result.totalWager)} cr`}
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
            disabled={!canSpin}
            onClick={spin}
            feedbackEvent="bet"
          >
            {spinning ? "Spinning..." : "Spin"}
          </Button>
        )}
      </div>

      {history.length > 0 ? (
        <section className={styles.section} aria-label="Round history">
          <h2 className={styles.sectionTitle}>Last results</h2>
          <div className={styles.history}>
            {history.map((entry, index) => (
              <span
                key={`${index}-${entry.number}`}
                className={styles.tile}
                data-color={entry.color}
              >
                {entry.number}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const EVEN_LABELS: Record<string, string> = {
  "low:": "1-18",
  "even:": "Even",
  "red:": "Red",
  "black:": "Black",
  "odd:": "Odd",
  "high:": "19-36",
};

const EVEN_VARIANT: Record<string, "outline" | "red" | "black"> = {
  "red:": "red",
  "black:": "black",
};

interface BoardCellProps {
  label: string;
  variant: "zero" | "red" | "black" | "green" | "outline";
  total?: number;
  winning?: boolean;
  spinning: boolean;
  onPlace: () => void;
  styleAttr?: CSSProperties;
  srText?: string;
}

function BoardCell({
  label,
  variant,
  total,
  winning,
  spinning,
  onPlace,
  styleAttr,
  srText,
}: BoardCellProps) {
  return (
    <button
      type="button"
      className={styles.cell}
      data-variant={variant}
      data-active={total !== undefined || undefined}
      data-winning={winning || undefined}
      style={styleAttr}
      aria-label={srText ?? `Number ${label}`}
      disabled={spinning}
      onClick={onPlace}
    >
      <span className={styles.cellLabel}>{label}</span>
      {total !== undefined ? (
        <span className={styles.badge} aria-hidden="true">
          {total}
        </span>
      ) : null}
    </button>
  );
}