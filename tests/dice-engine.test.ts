import { describe, expect, it } from "vitest";
import {
  DICE_TOTALS,
  LOW_HIGH_MULTIPLIER,
  createDiceEngine,
  exactMultiplier,
  isDicePrediction,
  type DicePrediction,
  type DiceResult,
  type DiceState,
  type DiceValue,
} from "@/games/dice";
import { createSeededRng, type Rng } from "@/core/randomness";
import {
  MAX_BET,
  MIN_BET,
  type GameRoundContext,
} from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "dice", roundId: "round-1", startedAt: 1234 };

/** A pick that lands exactly on `face` (pick indexes 0..5). */
function face(face: DiceValue): number {
  return (face - 0.5) / 6;
}

function scripted(values: readonly number[]): Rng {
  const queue = [...values];
  return { next: () => queue.shift() ?? face(1) };
}

function rollState(prediction: DicePrediction): DiceState {
  return { roundId: "round-1", startedAt: 1234, wager: 100, prediction };
}

describe("dice predictions", () => {
  it("recognises under, over, and exact totals", () => {
    expect(isDicePrediction("under")).toBe(true);
    expect(isDicePrediction("over")).toBe(true);
    expect(isDicePrediction({ total: 7 })).toBe(true);
    expect(isDicePrediction("heads")).toBe(false);
    expect(isDicePrediction({ total: 1 })).toBe(false);
    expect(isDicePrediction({ total: 13 })).toBe(false);
    expect(isDicePrediction(null)).toBe(false);
    expect(isDicePrediction({})).toBe(false);
  });

  it("covers the two-die domain", () => {
    expect(DICE_TOTALS).toHaveLength(11);
    expect(DICE_TOTALS[0]).toBe(2);
    expect(DICE_TOTALS[10]).toBe(12);
  });
});

describe("exact multipliers", () => {
  it("scales by how many ways a total can roll", () => {
    expect(exactMultiplier(2)).toBe(32);
    expect(exactMultiplier(3)).toBe(16);
    expect(exactMultiplier(4)).toBe(10);
    expect(exactMultiplier(5)).toBe(8);
    expect(exactMultiplier(6)).toBe(6);
    expect(exactMultiplier(7)).toBe(5);
    expect(exactMultiplier(12)).toBe(32);
  });
});

describe("DiceEngine beginRound", () => {
  it("exposes identity and version", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("dice");
    expect(engine.version).toBe("1.0.0");
  });

  it("accepts a valid wager and prediction", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    const state = engine.beginRound(ctx, { wager: 500, prediction: "over" });
    expect(state).toMatchObject({ roundId: "round-1", wager: 500, prediction: "over" });
  });

  it("rejects a missing wager", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { prediction: "under" })).toThrow(/wager/);
  });

  it("rejects a fractional wager", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100.5, prediction: "under" })).toThrow(/whole number/);
  });

  it("rejects wagers outside the allowed range", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1, prediction: "under" })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1, prediction: "under" })).toThrow(/between/);
  });

  it("rejects unknown predictions", () => {
    const engine = createDiceEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100, prediction: "seven" })).toThrow(/pick under/);
    expect(() => engine.beginRound(ctx, { wager: 100, prediction: { total: 1 } })).toThrow(/pick under/);
  });
});

describe("DiceEngine finishRound", () => {
  it("rolls the two die that were scripted", () => {
    const engine = createDiceEngine(scripted([face(5), face(2)]));
    const result = engine.finishRound(ctx, rollState("over"));
    expect(result.die1).toBe(5);
    expect(result.die2).toBe(2);
    expect(result.total).toBe(7);
  });

  it("pays under even money when the total is six or less", () => {
    const engine = createDiceEngine(scripted([face(1), face(1)]));
    const result = engine.finishRound(ctx, rollState("under"));
    expect(result).toMatchObject({ total: 2, outcome: "win", multiplier: LOW_HIGH_MULTIPLIER, payout: 200 });
  });

  it("loses under on a seven", () => {
    const engine = createDiceEngine(scripted([face(2), face(5)]));
    const result = engine.finishRound(ctx, rollState("under"));
    expect(result.total).toBe(7);
    expect(result.outcome).toBe("loss");
    expect(result.payout).toBe(0);
  });

  it("pays over even money when the total is eight or more", () => {
    const engine = createDiceEngine(scripted([face(6), face(4)]));
    const result = engine.finishRound(ctx, rollState("over"));
    expect(result).toMatchObject({ total: 10, outcome: "win", multiplier: LOW_HIGH_MULTIPLIER, payout: 200 });
  });

  it("loses over on a seven", () => {
    const engine = createDiceEngine(scripted([face(6), face(1)]));
    const result = engine.finishRound(ctx, rollState("over"));
    expect(result.total).toBe(7);
    expect(result.outcome).toBe("loss");
  });

  it("pays an exact total at its own multiplier", () => {
    const engine = createDiceEngine(scripted([face(3), face(4)]));
    const result = engine.finishRound(ctx, rollState({ total: 7 }));
    expect(result.total).toBe(7);
    expect(result.multiplier).toBe(exactMultiplier(7));
    expect(result.outcome).toBe("win");
    expect(result.payout).toBe(100 * exactMultiplier(7));
  });

  it("pays hard totals at 32x", () => {
    const engine = createDiceEngine(scripted([face(6), face(6)]));
    const result = engine.finishRound(ctx, rollState({ total: 12 }));
    expect(result.outcome).toBe("win");
    expect(result.multiplier).toBe(32);
    expect(result.payout).toBe(3_200);
  });

  it("loses when the exact total misses", () => {
    const engine = createDiceEngine(scripted([face(1), face(1)]));
    const result = engine.finishRound(ctx, rollState({ total: 12 }));
    expect(result.total).toBe(2);
    expect(result.outcome).toBe("loss");
    expect(result.payout).toBe(0);
  });

  it("reports the prediction it settled", () => {
    const engine = createDiceEngine(scripted([face(2), face(3)]));
    const result = engine.finishRound(ctx, rollState("over"));
    expect(result.prediction).toBe("over");
  });

  it("is deterministic under a seeded rng", () => {
    const a = createDiceEngine(createSeededRng("round-5000"));
    const b = createDiceEngine(createSeededRng("round-5000"));
    expect(a.finishRound(ctx, rollState("over"))).toEqual(b.finishRound(ctx, rollState("over")));
  });
});