import { describe, expect, it } from "vitest";
import {
  BOARD_TILES,
  MAX_MINES,
  MIN_MINES,
  multiplierFor,
  createMinesEngine,
  type MinesEngine,
  type MinesState,
} from "@/games/mines";
import { createSeededRng } from "@/core/randomness";
import {
  MAX_BET,
  MIN_BET,
  type GameRoundContext,
} from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "mines", roundId: "round-1", startedAt: 1234 };

function state(bombs: readonly number[]): MinesState {
  return {
    roundId: "round-1",
    startedAt: 1234,
    wager: 100,
    mines: bombs.length,
    bombCells: bombs,
    revealed: [],
    finished: false,
    cashedOut: false,
  };
}

function revealedState(bombs: readonly number[], revealed: readonly number[]): MinesState {
  return { ...state(bombs), revealed };
}

function firstFree(engine: MinesEngine, s: MinesState): number {
  for (let cell = 0; cell < BOARD_TILES; cell += 1) {
    if (!engine.isBomb(s, cell)) return cell;
  }
  throw new Error("no free tile");
}

describe("mines multipliers", () => {
  it("offers 1 before any reveal", () => {
    expect(multiplierFor(BOARD_TILES, 5, 0)).toBe(1);
  });

  it("rises with each safe pick, edged below fair", () => {
    expect(multiplierFor(BOARD_TILES, 5, 1)).toBe(1.23);
    expect(multiplierFor(BOARD_TILES, 5, 2)).toBe(1.56);
    expect(multiplierFor(BOARD_TILES, 5, 5)).toBe(3.39);
  });

  it("pays hard for the scarce safe tile", () => {
    expect(multiplierFor(BOARD_TILES, 24, 1)).toBe(24.75);
  });
});

describe("MinesEngine beginRound", () => {
  it("exposes identity and version", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("mines");
    expect(engine.version).toBe("1.0.0");
  });

  it("places the requested bomb count within the board", () => {
    const engine = createMinesEngine(createSeededRng("mines-1"));
    const s = engine.beginRound(ctx, { wager: 500, mines: 7 });
    expect(s.mines).toBe(7);
    expect(s.bombCells).toHaveLength(7);
    s.bombCells.forEach((cell) => {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(BOARD_TILES);
    });
  });

  it("rejects a missing wager or mines", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100 })).toThrow(/wager and mines/);
    expect(() => engine.beginRound(ctx, { mines: 5 })).toThrow(/wager and mines/);
  });

  it("rejects fractional or out-of-range wagers", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100.5, mines: 5 })).toThrow(/whole number/);
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1, mines: 5 })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1, mines: 5 })).toThrow(/between/);
  });

  it("rejects fractional or out-of-range mine counts", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100, mines: 2.5 })).toThrow(/whole number/);
    expect(() => engine.beginRound(ctx, { wager: 100, mines: MIN_MINES - 1 })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: 100, mines: MAX_MINES + 1 })).toThrow(/between/);
  });

  it("is deterministic under a seeded rng", () => {
    const a = createMinesEngine(createSeededRng("round-8000"));
    const b = createMinesEngine(createSeededRng("round-8000"));
    expect(a.beginRound(ctx, { wager: 1000, mines: 5 })).toEqual(
      b.beginRound(ctx, { wager: 1000, mines: 5 }),
    );
  });
});

describe("MinesEngine reveal", () => {
  it("reveals a free tile and raises the multiplier", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = state([0, 1]);
    const reveal = engine.reveal(s, 2);
    expect(reveal.kind).toBe("safe");
    if (reveal.kind !== "safe") return;
    expect(reveal.state.revealed).toEqual([2]);
    expect(reveal.multiplier).toBe(multiplierFor(BOARD_TILES, 2, 1));
    expect(reveal.boardCleared).toBe(false);
  });

  it("ends the round on a bomb with zero payout", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const reveal = engine.reveal(state([4, 9]), 4);
    expect(reveal.kind).toBe("mine");
    if (reveal.kind !== "mine") return;
    expect(reveal.result.outcome).toBe("mine");
    expect(reveal.result.payout).toBe(0);
    expect(reveal.result.bombCells).toEqual([4, 9]);
  });

  it("rejects already-revealed tiles", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = revealedState([0], [1]);
    expect(() => engine.reveal(s, 1)).toThrow(/already revealed/);
  });

  it("rejects tiles outside the board", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.reveal(state([0]), -1)).toThrow(/within/);
    expect(() => engine.reveal(state([0]), BOARD_TILES)).toThrow(/within/);
  });

  it("flags when the last safe tile is found", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = revealedState([0], [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    const reveal = engine.reveal(s, 1);
    expect(reveal.kind).toBe("safe");
    if (reveal.kind !== "safe") return;
    expect(reveal.boardCleared).toBe(true);
    expect(reveal.state.revealed).toHaveLength(BOARD_TILES - 1);
  });

  it("scans a live board consistently", () => {
    const engine = createMinesEngine(createSeededRng("live-board"));
    const s = engine.beginRound(ctx, { wager: 100, mines: 5 });
    const free = firstFree(engine, s);
    const reveal = engine.reveal(s, free);
    expect(reveal.kind).toBe("safe");
  });
});

describe("MinesEngine cashOut", () => {
  it("banks floor(wager x multiplier) after safe reveals", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = revealedState([0, 1], [2, 3, 4, 5]);
    const result = engine.cashOut(s);
    const multiplier = multiplierFor(BOARD_TILES, 2, 4);
    expect(result.outcome).toBe("win");
    expect(result.multiplier).toBe(multiplier);
    expect(result.payout).toBe(Math.floor(100 * multiplier));
  });

  it("refuses a cash-out before any reveal", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.cashOut(state([0]))).toThrow(/reveal/i);
  });

  it("refuses a cash-out after the round ended", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.cashOut({ ...state([0]), finished: true })).toThrow(/over/);
    expect(() => engine.cashOut({ ...state([0]), cashedOut: true })).toThrow(/cashed out/);
  });

  it("settles a fully cleared board at the top multiple", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = revealedState([0], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    const result = engine.cashOut(s);
    expect(result.multiplier).toBe(24.75);
    expect(result.payout).toBe(2_475);
  });
});

describe("MinesEngine finishRound", () => {
  it("throws for a round that never moved", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    expect(() => engine.finishRound(ctx, state([0]))).toThrow(/reveal a tile/);
  });

  it("resolves a finished round as a mine", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const result = engine.finishRound(ctx, { ...state([0]), finished: true });
    expect(result.outcome).toBe("mine");
  });

  it("resolves a cashed-out round as its win", () => {
    const engine = createMinesEngine(createSeededRng("x"));
    const s = revealedState([0], [2, 3]);
    const result = engine.finishRound(ctx, { ...s, cashedOut: true });
    expect(result.outcome).toBe("win");
    expect(result.payout).toBe(Math.floor(100 * multiplierFor(BOARD_TILES, 1, 2)));
  });
});