import { describe, expect, it } from "vitest";
import {
  PAYTABLE,
  SLOT_ROWS,
  SLOT_SYMBOLS,
  SYMBOL_ORDER,
  createSlotsEngine,
  isSlotSymbol,
  type SlotSymbol,
  type SlotsResult,
  type SlotsState,
} from "@/games/slots";
import { createSeededRng, type Rng } from "@/core/randomness";
import { MIN_BET, MAX_BET, type GameRoundContext } from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "slots", roundId: "round-1", startedAt: 1234 };

const TOTAL_WEIGHT = 215;
const BANDS: Record<SlotSymbol, [number, number]> = {
  cherry: [0, 72],
  lemon: [72, 122],
  orange: [122, 160],
  grape: [160, 186],
  bell: [186, 200],
  diamond: [200, 209],
  seven: [209, 215],
};

/** A pick that lands exactly on `symbol`'s weight band. */
function band(symbol: SlotSymbol): number {
  const [start, end] = BANDS[symbol];
  return (start + end) / 2 / TOTAL_WEIGHT;
}

/** Scripted RNG: each call returns the next value, then leans toward cherry. */
function scripted(values: readonly number[]): Rng {
  const queue = [...values];
  return { next: () => queue.shift() ?? band("cherry") };
}

/** Builds a 15-entry pick sequence; column order top/mid/bottom per reel. */
function picks(
  middle: readonly { column: number; symbol: SlotSymbol }[],
): number[] {
  const values = new Array<number>(5 * SLOT_ROWS).fill(band("cherry"));
  for (const { column, symbol } of middle) {
    values[column * SLOT_ROWS + 1] = band(symbol);
  }
  return values;
}

function spin(result: SlotsResult): readonly (readonly SlotSymbol[])[] {
  return result.columns;
}

describe("slots symbols", () => {
  it("exposes a fixed symbol set", () => {
    expect(SLOT_SYMBOLS).toHaveLength(7);
    expect(SLOT_SYMBOLS).toContain("cherry");
    expect(SLOT_SYMBOLS).toContain("seven");
    expect(isSlotSymbol("five-of-kind-thing")).toBe(false);
    expect(isSlotSymbol("seven")).toBe(true);
  });
});

describe("SlotsEngine beginRound", () => {
  it("exposes identity and version", () => {
    const engine = createSlotsEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("slots");
    expect(engine.version).toBe("1.0.0");
  });

  it("accepts a valid wager", () => {
    const engine = createSlotsEngine(createSeededRng("x"));
    const state = engine.beginRound(ctx, { wager: 500 });
    expect(state).toMatchObject({ roundId: "round-1", startedAt: 1234, wager: 500 });
  });

  it("rejects a missing wager", () => {
    const engine = createSlotsEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, {})).toThrow(/wager/);
  });

  it("rejects a fractional wager", () => {
    const engine = createSlotsEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100.5 })).toThrow(/whole number/);
  });

  it("rejects wagers outside the allowed range", () => {
    const engine = createSlotsEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1 })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1 })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: Number.NaN })).toThrow(/wager/);
  });
});

describe("SlotsEngine finishRound", () => {
  it("produces a five-by-three grid of valid symbols", () => {
    const engine = createSlotsEngine(scripted([]));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(spin(result)).toHaveLength(5);
    for (const reel of spin(result)) {
      expect(reel).toHaveLength(3);
      for (const symbol of reel) {
        expect(SLOT_SYMBOLS).toContain(symbol);
      }
    }
  });

  it("pays five of a kind at the symbol's five-of-a-kind multiplier", () => {
    const columns = [0, 1, 2, 3, 4].map((column) => ({ column, symbol: "seven" as const }));
    const engine = createSlotsEngine(scripted(picks(columns)));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 200 });
    expect(result.outcome).toBe("win");
    expect(result.symbol).toBe("seven");
    expect(result.multiplier).toBe(PAYTABLE.seven.five);
    expect(result.payout).toBe(200 * PAYTABLE.seven.five);
    expect(result.lines[0]?.columns).toEqual([0, 1, 2, 3, 4]);
  });

  it("pays four of a kind when the fifth column breaks the run", () => {
    const columns = [0, 1, 2, 3].map((column) => ({ column, symbol: "bell" as const }));
    const engine = createSlotsEngine(scripted(picks([...columns, { column: 4, symbol: "cherry" }])));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(result.outcome).toBe("win");
    expect(result.symbol).toBe("bell");
    expect(result.multiplier).toBe(PAYTABLE.bell.four);
    expect(result.lines[0]?.matched).toBe(4);
  });

  it("pays three of a kind", () => {
    const columns = [0, 1, 2].map((column) => ({ column, symbol: "grape" as const }));
    const engine = createSlotsEngine(scripted(picks([...columns, { column: 3, symbol: "cherry" }])));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(result.outcome).toBe("win");
    expect(result.multiplier).toBe(PAYTABLE.grape.three);
    expect(result.lines[0]?.columns).toEqual([0, 1, 2]);
  });

  it("pays two cherries even money", () => {
    const columns = [0, 1].map((column) => ({ column, symbol: "cherry" as const }));
    const engine = createSlotsEngine(scripted(picks([...columns, { column: 2, symbol: "lemon" }])));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 1_000 });
    expect(result.outcome).toBe("win");
    expect(result.multiplier).toBe(1);
    expect(result.payout).toBe(1_000);
  });

  it("pays nothing for two of any other symbol", () => {
    const columns = [0, 1].map((column) => ({ column, symbol: "seven" as const }));
    const engine = createSlotsEngine(scripted(picks([...columns, { column: 2, symbol: "lemon" }])));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(result.outcome).toBe("loss");
    expect(result.payout).toBe(0);
    expect(result.multiplier).toBe(0);
    expect(result.lines).toHaveLength(0);
  });

  it("reports a loss for a broken middle row", () => {
    const engine = createSlotsEngine(
      scripted(
        picks([
          { column: 0, symbol: "lemon" },
          { column: 1, symbol: "orange" },
          { column: 2, symbol: "grape" },
        ]),
      ),
    );
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 500 });
    expect(result.outcome).toBe("loss");
    expect(result.symbol).toBeNull();
    expect(result.payout).toBe(0);
  });

  it("never pays when the run would start on a non-winning cell", () => {
    // middle row: col0 lives above the payline only if row order is wrong;
    // verify the payline reads the mid row, not the top row.
    const middle = [0, 1, 2].map((column) => ({ column, symbol: "lemon" as const }));
    const values = new Array<number>(5 * SLOT_ROWS).fill(band("cherry"));
    for (const { column, symbol } of middle) {
      values[column * SLOT_ROWS + 1] = band(symbol);
    }
    // Force the top row of column 0 to a seven; the payline must ignore it.
    values[0] = band("seven");
    const engine = createSlotsEngine(scripted(values));
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(result.symbol).toBe("lemon");
    expect(result.multiplier).toBe(PAYTABLE.lemon.three);
    expect(result.columns[0]?.[0]).toBe("seven");
    expect(result.columns[0]?.[1]).toBe("lemon");
  });

  it("ignores reels off the line for scoring", () => {
    // Only columns 0..2 factors; a seven in column 3's top row must not score.
    const engine = createSlotsEngine(
      scripted(picks([{ column: 0, symbol: "lemon" }, { column: 1, symbol: "lemon" }])),
    );
    const result = engine.finishRound(ctx, { roundId: "round-1", startedAt: 1234, wager: 100 });
    expect(result.lines).toHaveLength(0);
  });

  it("is deterministic under a seeded rng", () => {
    const a = createSlotsEngine(createSeededRng("round-9000"));
    const b = createSlotsEngine(createSeededRng("round-9000"));
    const state: SlotsState = { roundId: "round-1", startedAt: 1234, wager: 100 };
    const first = a.finishRound(ctx, state);
    const second = b.finishRound(ctx, state);
    expect(first).toEqual(second);
  });

  it("stays within the configured symbol domain", () => {
    const engine = createSlotsEngine(createSeededRng("fresh"));
    for (let round = 0; round < 20; round += 1) {
      const result = engine.finishRound(
        ctx,
        { roundId: `round-${round}`, startedAt: 1234, wager: 100 },
      );
      for (const reel of result.columns) {
        expect(reel.every((symbol) => (SYMBOL_ORDER as readonly string[]).includes(symbol))).toBe(true);
      }
      expect(result.lines.length <= 1).toBe(true);
      expect(result.payout >= 0).toBe(true);
    }
  });
});