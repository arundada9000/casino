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
  BOARD_SIZE,
  BOARD_TILES,
  MINES_OPTIONS,
  createMinesEngine,
  multiplierFor,
  type MinesEngine,
  type MinesResult,
  type MinesState,
} from "@/games/mines";

import styles from "./mines.module.css";

type Phase = "setup" | "playing" | "over";

type TileState = "hidden" | "safe" | "bomb";

export function MinesScreen({ engine }: { engine?: MinesEngine }) {
  const engineRef = useMemo(
    () => engine ?? createMinesEngine(createRng()),
    [engine],
  );
  const balance = useEconomyStore((state) => state.balance);
  const bet = useEconomyStore((state) => state.bet);
  const award = useEconomyStore((state) => state.award);

  const [wager, setWager] = useState(MIN_BET);
  const [mines, setMines] = useState(5);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<MinesState | null>(null);
  const [result, setResult] = useState<MinesResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly MinesResult[]>([]);

  const playing = phase === "playing";
  const over = phase === "over";
  const overBalance = wager > balance;
  const canStart = phase === "setup" && !overBalance;
  const safeFound = round?.revealed.length ?? 0;
  const currentMultiplier =
    round && playing ? multiplierFor(BOARD_TILES, round.mines, safeFound) : 1;
  const nextMultiplier =
    round && playing
      ? multiplierFor(BOARD_TILES, round.mines, round.revealed.length + 1)
      : 1;

  function setBetAmount(value: number) {
    feedback("select");
    setWager(clampWager(value));
  }

  function nudge(delta: number) {
    feedback("tap");
    setWager(clampWager(wager + delta));
  }

  function pickMines(value: number) {
    feedback("select");
    setMines(value);
  }

  function startRound() {
    if (phase !== "setup" || overBalance) return;
    const roundId = newId();
    const ctx = { gameId: "mines" as const, roundId, startedAt: Date.now() };

    try {
      bet(wager, { ...ctx, note: "Mines board" });
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    let state: MinesState;
    try {
      state = engineRef.beginRound(ctx, { wager, mines });
    } catch (error) {
      useEconomyStore.getState().returnCredits(wager, { ...ctx, note: "Round refunded" });
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }

    setRound(state);
    setResult(null);
    setNotice(null);
    setPhase("playing");
  }

  function revealCell(cell: number) {
    if (phase !== "playing" || round === null) return;
    if (round.revealed.includes(cell) || round.finished || round.cashedOut) return;
    let reveal;
    try {
      reveal = engineRef.reveal(round, cell);
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    if (reveal.kind === "mine") {
      setResult(reveal.result);
      setHistory((current) => [reveal.result, ...current].slice(0, 12));
      setPhase("over");
      feedback("loss");
      return;
    }
    setRound(reveal.state);
    if (reveal.boardCleared) {
      cashOutAt(reveal.state);
    }
  }

  function pressCashOut() {
    if (phase !== "playing" || round === null) return;
    cashOutAt(round);
  }

  function cashOutAt(state: MinesState) {
    let outcome: MinesResult;
    try {
      outcome = engineRef.cashOut(state);
    } catch (error) {
      setNotice(errorMessage(error));
      feedback("error");
      return;
    }
    try {
      award(outcome.payout, {
        gameId: "mines",
        roundId: state.roundId,
        note: `Mines cash-out ${outcome.multiplier.toFixed(2)}x`,
      });
    } catch (error) {
      useEconomyStore.getState().returnCredits(state.wager, {
        gameId: "mines",
        roundId: state.roundId,
        note: "Round refunded",
      });
      setNotice(errorMessage(error));
      feedback("error");
      setResult(outcome);
      setHistory((current) => [outcome, ...current].slice(0, 12));
      setPhase("over");
      return;
    }
    setResult(outcome);
    setHistory((current) => [outcome, ...current].slice(0, 12));
    setPhase("over");
    feedback("win");
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

  function tileState(cell: number): TileState {
    if (round?.revealed.includes(cell)) return "safe";
    if (round?.bombCells.includes(cell) && over) return "bomb";
    return "hidden";
  }

  const cashingOut = playing && safeFound > 0;

  usePrimaryActionKey(
    cashingOut ? pressCashOut : over ? newRound : startRound,
    !cashingOut && !over && (phase !== "setup" || !canStart),
  );

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/games">
        <ChevronLeftIcon size={18} />
        Games
      </Link>

      <LargeTitle>Mines</LargeTitle>
      <p className={styles.subtitle}>Reveal safe tiles to grow the payout. One bomb ends the round.</p>

      <section className={styles.arena} aria-label="Minefield">
        <div className={styles.arenaHeader}>
          <span className={styles.arenaBrand}>Mines</span>
          <span className={styles.arenaTag}>
            {over
              ? result?.outcome === "win"
                ? "Banked"
                : "Mine hit"
              : playing
                ? `${mines} bombs · ${BOARD_TILES - mines} safe`
                : "Set the field"}
          </span>
        </div>

        <div className={styles.readout}>
          <span className={styles.readoutValue} data-loss={result?.outcome === "mine" || undefined} data-win={result?.outcome === "win" || undefined}>
            {result?.outcome === "win" ? `${result.multiplier.toFixed(2)}x` : result?.outcome === "mine" ? "0x" : `${currentMultiplier.toFixed(2)}x`}
          </span>
          <span className={styles.readoutHint}>
            {playing
              ? `${safeFound} of ${BOARD_TILES - mines} safe found · next tile pays ${nextMultiplier.toFixed(2)}x`
              : over
                ? result?.outcome === "mine"
                  ? "The wager stays with the house."
                  : `Cashed out at ${result?.multiplier.toFixed(2)}x.`
                : "Pick a wager and bomb count, then start."}
          </span>
        </div>

        <div className={styles.grid} role="grid" aria-label="Minefield board">
          {Array.from({ length: BOARD_TILES }, (_, cell) => {
            const state = tileState(cell);
            return (
              <button
                key={cell}
                role="gridcell"
                type="button"
                className={styles.tile}
                data-state={state}
                style={{ transitionDelay: state === "bomb" ? `${(cell % BOARD_SIZE) * 40}ms` : undefined }}
                onClick={() => revealCell(cell)}
                disabled={!playing || state !== "hidden"}
                aria-label={state === "hidden" ? `Reveal tile ${cell + 1}` : state === "safe" ? `Tile ${cell + 1} is safe` : `Tile ${cell + 1} is a bomb`}
              >
                {state === "safe" ? (
                  <span className={styles.gem} aria-hidden />
                ) : state === "bomb" ? (
                  <span className={styles.bomb} aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>

        {playing && safeFound > 0 && (
          <Button
            variant="primary"
            size="lg"
            className={styles.cashOut}
            onClick={pressCashOut}
            feedbackEvent="select"
          >
            Cash out {currentMultiplier.toFixed(2)}x · +{formatCredits(
              Math.floor(wager * currentMultiplier),
            )} cr
          </Button>
        )}

        {over && result && (
          <div className={styles.result} data-outcome={result.outcome} role="status">
            <div className={styles.resultTitle}>
              {result.outcome === "win" ? "Cashed out" : "Mine hit"}
            </div>
            {result.payout > 0 && (
              <div className={styles.resultLine}>
                +{formatCredits(result.payout)} cr
              </div>
            )}
            <div className={styles.resultDetail}>
              {result.outcome === "win"
                ? `${safeFound} safe tiles · ${result.multiplier.toFixed(2)}x`
                : `${formatCredits(result.wager)} cr stays with the house`}
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

      <section className={styles.section} aria-label="Bomb count">
        <div className={styles.stepperHeader}>
          <h2 className={styles.sectionTitle}>Bombs</h2>
          <span className={styles.limit}>on a {BOARD_SIZE} x {BOARD_SIZE} board</span>
        </div>
        <div className={styles.mineRow}>
          {MINES_OPTIONS.map((count) => (
            <button
              key={count}
              className={styles.mineChip}
              data-active={mines === count}
              onClick={() => pickMines(count)}
              type="button"
              disabled={phase !== "setup"}
            >
              {count}
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
            disabled={!canStart}
            onClick={startRound}
            feedbackEvent="bet"
          >
            Start
          </Button>
        )}
        {playing && safeFound === 0 && (
          <Button variant="secondary" size="lg" disabled>
            Reveal a tile to unlock cash-out
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
                  data-outcome={item.outcome}
                  title={
                    item.outcome === "win"
                      ? `Cashed out ${item.multiplier.toFixed(2)}x · ${formatCredits(item.payout, { signed: true })}`
                      : `Mine hit · ${formatCredits(item.wager)} cr`
                  }
                >
                  {item.outcome === "win" ? "W" : "B"}
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