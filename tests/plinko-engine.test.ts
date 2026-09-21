import { describe, expect, it } from "vitest";
import {
  MAX_MULTIPLIER,
  MAX_ROWS,
  MIN_ROWS,
  ROW_OPTIONS,
  combinations,
  createPlinkoEngine,
  multiplierFor,
  shapeNormalizer,
  slotProbability,
  type PlinkoEngine,
  type PlinkoResult,
  type PlinkoState,
} from "@/games/plinko";
import { createSeededRng } from "@/core/randomness";
import {
  MAX_BET,
  MIN_BET,
  type GameRoundContext,
} from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "plinko", roundId: "round-1", startedAt: 1234 };

function state(result: PlinkoResult): PlinkoState {
  return {
    roundId: "round-1",
    startedAt: 1234,
    wager: result.wager,
    rows: result.rows,
    slot: result.slot,
    path: result.path,
    finished: false,
    cashedOut: false,
  };
}

describe("PlinkoConfig", () => {
  it("computes exact small binomial coefficients", () => {
    expect(combinations(8, 4)).toBe(70);
    expect(combinations(10, 0)).toBe(1);
    expect(combinations(10, 10)).toBe(1);
    expect(combinations(16, 8)).toBe(12870);
  });

  it("returns zero coefficients outside the row range", () => {
    expect(combinations(8, -1)).toBe(0);
    expect(combinations(8, 9)).toBe(0);
  });

  it("offers configurable board sizes", () => {
    expect(ROW_OPTIONS).toContain(MIN_ROWS);
    expect(ROW_OPTIONS).toContain(MAX_ROWS);
    expect(ROW_OPTIONS).toContain(10);
    expect(ROW_OPTIONS).toContain(12);
  });

  it("centres the probability mass for a fair-coin ball", () => {
    expect(slotProbability(8, 4)).toBeCloseTo(70 / 256);
    expect(slotProbability(12, 6)).toBeCloseTo(924 / 4096);
    expect(slotProbability(16, 0)).toBeCloseTo(1 / 65536);
  });

  it("pays the known ladder at the centre slot", () => {
    expect(multiplierFor(8, 4)).toBe(3.02);
    expect(multiplierFor(10, 5)).toBe(3.26);
    expect(multiplierFor(12, 6)).toBe(3.43);
    expect(multiplierFor(16, 8)).toBe(3.51);
  });

  it("pays the known ladder at the rare outer slots", () => {
    expect(multiplierFor(8, 8)).toBe(0.42);
    expect(multiplierFor(12, 0)).toBe(9.64);
    expect(multiplierFor(12, 1)).toBe(2.88);
    expect(multiplierFor(16, 0)).toBe(40.18);
    expect(multiplierFor(16, 1)).toBe(20.09);
  });

  it("is symmetric across the centre slot", () => {
    for (const rows of ROW_OPTIONS) {
      for (let slot = 0; slot <= rows; slot += 1) {
        expect(multiplierFor(rows, slot)).toBe(multiplierFor(rows, rows - slot));
      }
    }
  });

  it("returns the target edge on every board", () => {
    for (const rows of ROW_OPTIONS) {
      let weighted = 0;
      for (let slot = 0; slot <= rows; slot += 1) {
        weighted += slotProbability(rows, slot) * multiplierFor(rows, slot);
      }
      expect(weighted).toBeGreaterThan(0.97);
      expect(weighted).toBeLessThan(0.99);
      expect(shapeNormalizer(rows)).toBeGreaterThan(0.5);
    }
  });

  it("never exceeds the ledger-safe cap", () => {
    for (const rows of ROW_OPTIONS) {
      for (let slot = 0; slot <= rows; slot += 1) {
        expect(multiplierFor(rows, slot)).toBeLessThanOrEqual(MAX_MULTIPLIER);
      }
    }
  });
});

describe("PlinkoEngine beginRound", () => {
  const engine = createPlinkoEngine(createSeededRng("plinko"));

  it("rejects a missing payload", () => {
    expect(() => engine.beginRound(ctx)).toThrow();
    expect(() => engine.beginRound(ctx, {})).toThrow("wager and rows are required.");
  });

  it("rejects non-whole wagers", () => {
    expect(() => engine.beginRound(ctx, { wager: 100.9, rows: 12 })).toThrow(
      "wager must be a whole number",
    );
  });

  it("rejects wagers outside the shared range", () => {
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1, rows: 12 })).toThrow("between");
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1, rows: 12 })).toThrow("between");
  });

  it("rejects non-whole row counts", () => {
    expect(() => engine.beginRound(ctx, { wager: 100, rows: 12.5 })).toThrow(
      "rows must be a whole number",
    );
  });

  it("rejects row counts outside the configurable board", () => {
    expect(() => engine.beginRound(ctx, { wager: 100, rows: MIN_ROWS - 1 })).toThrow("between");
    expect(() => engine.beginRound(ctx, { wager: 100, rows: MAX_ROWS + 1 })).toThrow("between");
  });

  it("tracks the wager and board size on the state", () => {
    const round = engine.beginRound(ctx, { wager: 250, rows: 10 });
    expect(round.wager).toBe(250);
    expect(round.rows).toBe(10);
  });

  it("draws one bounce per peg row", () => {
    for (const rows of ROW_OPTIONS) {
      const round = engine.beginRound(ctx, { wager: 100, rows });
      expect(round.path).toHaveLength(rows);
      expect(round.path.every((bounce) => typeof bounce === "boolean")).toBe(true);
    }
  });

  it("lands inside the slot range with a path-matched slot", () => {
    for (const rows of ROW_OPTIONS) {
      const round = engine.beginRound(ctx, { wager: 100, rows });
      expect(round.slot).toBeGreaterThanOrEqual(0);
      expect(round.slot).toBeLessThanOrEqual(rows);
      const expected = round.path.filter(Boolean).length;
      expect(round.slot).toBe(expected);
    }
  });
});

describe("PlinkoEngine finishRound", () => {
  const engine = createPlinkoEngine(createSeededRng("plinko"));

  it("settles every slot with the ladder multiplier", () => {
    for (let iteration = 0; iteration < 120; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100, rows: 12 });
      const result = engine.finishRound(ctx, round);
      expect(result.outcome).toBe("win");
      expect(result.multiplier).toBe(multiplierFor(12, round.slot));
      expect(result.payout).toBe(Math.floor(100 * result.multiplier));
    }
  });

  it("pays the wager down to the last credit of a win", () => {
    const round = engine.beginRound(ctx, { wager: 123, rows: 8 });
    const result = engine.finishRound(ctx, round);
    expect(result.payout).toBe(Math.floor(123 * result.multiplier));
    expect(result.payout).toBeGreaterThan(0);
  });

  it("is idempotent", () => {
    const round = engine.beginRound(ctx, { wager: 100, rows: 10 });
    const first = engine.finishRound(ctx, round);
    const second = engine.finishRound(ctx, round);
    expect(second).toEqual(first);
  });

  it("settles an untouched round directly", () => {
    const round = engine.beginRound(ctx, { wager: 100, rows: 12 });
    expect(round.finished).toBe(false);
    const result = engine.finishRound(ctx, round);
    expect(result.payout).toBe(Math.floor(round.wager * result.multiplier));
  });

  it("mirrors the result payload on the flyout result state", () => {
    const round = engine.beginRound(ctx, { wager: 100, rows: 8 });
    const result = engine.finishRound(ctx, round);
    const onDisk = state(result);
    expect(engine.finishRound(ctx, onDisk)).toEqual(result);
  });
});

describe("PlinkoEngine determinism", () => {
  it("reproduces the same drop for a seed", () => {
    const first = createPlinkoEngine(createSeededRng("dim"));
    const second = createPlinkoEngine(createSeededRng("dim"));
    const dropA = first.beginRound(ctx, { wager: 100, rows: 12 });
    const dropB = second.beginRound(ctx, { wager: 100, rows: 12 });
    expect(dropA.path).toEqual(dropB.path);
    expect(dropA.slot).toBe(dropB.slot);
    expect(first.finishRound(ctx, dropA)).toEqual(second.finishRound(ctx, dropB));
  });

  it("produces varied drops across seeds", () => {
    const slots = new Set<number>();
    for (let i = 0; i < 40; i += 1) {
      const engine = createPlinkoEngine(createSeededRng(`seed-${i}`));
      const round = engine.beginRound(ctx, { wager: 100, rows: 12 });
      slots.add(round.slot);
    }
    expect(slots.size).toBeGreaterThan(4);
  });
});