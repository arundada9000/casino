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
  PAYTABLE,
  SLOT_COLUMNS,
  SLOT_REEL_STAGGER_MS,
  SLOT_SPIN_MS,
  SYMBOL_ORDER,
  createSlotsEngine,
  type SlotSymbol,
  type SlotsEngine,
  type SlotsResult,
} from "@/games/slots";

import styles from "./slots.module.css";

type Phase = "setup" | "spinning" | "revealed";

const GLYPH: Record<SlotSymbol, string> = {
  cherry: "C",
  lemon: "L",
  orange: "O",
  grape: "G",
  bell: "B",
  diamond: "◆",
  seven: "7",
};

const ORDINAL: Record<number, string> = {
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
};

/** Resting grid shown before the first spin. */
const IDLE_GRID: readonly (readonly SlotSymbol[])[] = [
  ["lemon", "cherry", "orange"],
  ["bell", "seven", "grape"],
  ["orange", "diamond", "lemon"],
  ["cherry", "grape", "bell"],
  ["seven", "orange", "diamond"],
];

const REEL_TOTAL_MS =
  SLOT_SPIN_MS + SLOT_REEL_STAGGER_MS * (SLOT_COLUMNS - 1);

/** Scroll distance per reel scales with its stop time for equal speeds. */
function reelDuration(reelIndex: number): number {
  return SLOT_SPIN_MS + reelIndex * SLOT_REEL_STAGGER_MS;
}

function reelFillers(reelIndex: number): number {
  return Math.round((12 * reelDuration(reelIndex)) / SLOT_SPIN_MS);
}

function lineSummary(result: SlotsResult): string {
  const line = result.lines[0];
  if (!line) return "No match";
  const count = line.columns.length;
  const ordinal = ORDINAL[count] ?? String(count);
  return `${ordinal} ${line.symbol} · pays ${line.multiplier}x`;
}

function Tile({
  symbol,
  win,
  idle,
}: {
  symbol: SlotSymbol;
  win?: boolean;
  idle?: boolean;
}) {
  return (
    <div
      className={styles.tile}
      data-symbol={symbol}
      data-win={win || undefined}
      data-idle={idle || undefined}
    >
      <span className={styles.tileGlyph}>{GLYPH[symbol]}</span>
      <span className={styles.tileName}>{symbol}</span>
    </div>
  );
}

function ReelWindow({
  column,
  reelIndex,
  spinning,
  idle,
  winners,
}: {
  column: readonly SlotSymbol[];
  reelIndex: number;
  spinning: boolean;
  idle: boolean;
  winners: ReadonlySet<number> | null;
}) {
  const fillers = reelFillers(reelIndex);
  const strip: SlotSymbol[] = [];
  for (let cell = 0; cell < fillers; cell += 1) {
    const cycle = (reelIndex * 2 + cell) % SYMBOL_ORDER.length;
    strip.push(SYMBOL_ORDER[cycle] as SlotSymbol);
  }
  // The authoritative grid sits at the top of the strip; the reel drops
  // out of the filler region onto it and comes to rest.
  const content = [...column, ...strip];
  return (
    <div className={styles.reelWindow} data-spinning={spinning ? true : undefined}>
      <div
        className={styles.reelStrip}
        style={
          {
            "--reel-duration": `${reelDuration(reelIndex)}ms`,
            "--reel-drop-from": `calc(var(--slot-cell) * -${fillers})`,
          } as React.CSSProperties
        }
      >
        {content.map((symbol, index) => (
          <Tile
            key={index}
            symbol={symbol}
            idle={idle}
            win={Boolean(winners?.has(reelIndex)) && index === 1}
          />
        ))}
      </div>
    </div>
  );
}

export function SlotsScreen({ engine }: { engine?: SlotsEngine }) {
  const engineRef = useMemo(
    () => engine ?? createSlotsEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("setup");
  const [result, setResult] = useState<SlotsResult | null>(null);
  const [history, setHistory] = useState<readonly SlotsResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const spinning = phase === "spinning";
  const revealed = phase === "revealed";
  const overBalance = wager > balance;
  const canSpin = phase === "setup" && !overBalance;

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
    const startedAt = Date.now();
    const ctx = { gameId: "slots" as const, roundId, startedAt };

    try {
      bet(wager, { ...ctx, note: `Slots ${wager.toLocaleString()} cr` });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state;
    try {
      state = engineRef.beginRound(ctx, { wager });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let outcome: SlotsResult;
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
          note: `Slots win · ${outcome.multiplier}x`,
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
    setPhase("spinning");
    window.setTimeout(() => {
      setPhase("revealed");
      setHistory((current) => [outcome, ...current].slice(0, 12));
      feedback(outcome.payout > 0 ? "win" : "loss");
    }, REEL_TOTAL_MS);
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

  const winningColumns = useMemo(() => {
    if (!result || phase !== "revealed") return new Set<number>();
    return new Set(result.lines[0]?.columns ?? []);
  }, [result, phase]);

  const paytableRows = SYMBOL_ORDER.map((symbol) => {
    const row = PAYTABLE[symbol];
    return { symbol, ...row };
  });

  usePrimaryActionKey(revealed ? newRound : spin, !revealed && !canSpin);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Slots</LargeTitle>
      <p className={styles.subtitle}>Five reels, one payline. Match three of a kind.</p>

      <section className={styles.machine} aria-label="Slot machine">
        <div className={styles.machineHeader}>
          <span className={styles.machineBrand}>Slots</span>
          <span className={styles.paylineTag}>Middle row pays</span>
        </div>

        {result === null ? (
          <div className={styles.reels} aria-hidden>
            {Array.from({ length: SLOT_COLUMNS }, (_, reelIndex) => (
              <ReelWindow
                key={reelIndex}
                column={IDLE_GRID[reelIndex] ?? []}
                reelIndex={reelIndex}
                spinning={false}
                idle
                winners={null}
              />
            ))}
            <div className={styles.payline} aria-hidden />
          </div>
        ) : (
          <div className={styles.reels}>
            {Array.from({ length: SLOT_COLUMNS }, (_, reelIndex) => (
              <ReelWindow
                key={reelIndex}
                column={result.columns[reelIndex] ?? []}
                reelIndex={reelIndex}
                spinning={spinning}
                idle={false}
                winners={winningColumns}
              />
            ))}
            <div className={styles.payline} aria-hidden />
          </div>
        )}

        <p className={styles.caption} aria-live="polite">
          {spinning
            ? "Spinning..."
            : result === null
              ? "Place a bet and spin."
              : null}
        </p>

        {revealed && result && (
          <div className={styles.result} data-outcome={result.outcome} role="status">
            {result.payout > 0 ? (
              <>
                <div className={styles.resultTitle}>{lineSummary(result)}</div>
                <div className={styles.resultLine}>
                  +{formatCredits(result.payout)} cr
                </div>
                <div className={styles.resultDetail}>
                  {formatCredits(result.wager, { signed: false })} wagered
                </div>
              </>
            ) : (
              <>
                <div className={styles.resultTitle}>No match</div>
                <div className={styles.resultDetail}>
                  {formatCredits(result.wager, { signed: false })} cr stay with the house
                </div>
              </>
            )}
            <div className={styles.resultActions}>
              <Button variant="primary" onClick={newRound}>
                New round
              </Button>
            </div>
          </div>
        )}

        <details className={styles.paytable}>
          <summary>Payouts</summary>
          <div className={styles.paytableGrid}>
            <span className={styles.paytableHead}>Symbol</span>
            <span className={styles.paytableHead}>3x</span>
            <span className={styles.paytableHead}>4x</span>
            <span className={styles.paytableHead}>5x</span>
            {paytableRows.map(({ symbol, three, four, five }) => (
              <div className={styles.paytableRow} key={symbol}>
                <span className={styles.paytableSymbol}>
                  <span className={styles.paytableGlyph} data-symbol={symbol}>
                    {GLYPH[symbol]}
                  </span>
                  <span className={styles.paytableName}>{symbol}</span>
                </span>
                <span>{three}x</span>
                <span>{four}x</span>
                <span>{five}x</span>
              </div>
            ))}
            <div className={styles.paytableRow}>
              <span className={styles.paytableSymbol}>
                <span className={styles.paytableGlyph} data-symbol="cherry">
                  {GLYPH.cherry}
                </span>
                <span className={styles.paytableName}>2 cherries</span>
              </span>
              <span>1x</span>
              <span />
              <span />
            </div>
          </div>
        </details>
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
            disabled={spinning || wager <= MIN_BET}
          >
            -
          </button>
          <div className={styles.wager}>{formatCredits(wager)}</div>
          <button
            className={styles.step}
            onClick={() => nudge(BET_STEP)}
            aria-label="Increase wager"
            type="button"
            disabled={spinning || wager >= MAX_BET}
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
              disabled={spinning}
            >
              {formatCredits(preset)}
            </button>
          ))}
          <button
            className={styles.chip}
            data-active={wager === MIN_BET}
            onClick={() => setBetAmount(MIN_BET)}
            type="button"
            disabled={spinning}
          >
            Min
          </button>
          <button
            className={styles.chip}
            data-active={wager === MAX_BET ? true : undefined}
            onClick={() => setBetAmount(MAX_BET)}
            type="button"
            disabled={spinning}
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
            disabled={!canSpin}
            onClick={spin}
            feedbackEvent="bet"
          >
            {spinning ? "Spinning..." : "Spin"}
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
                  )}`}
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