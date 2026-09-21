import { describe, expect, it } from "vitest";
import {
  HOUSE_EDGE,
  WHEEL_SEGMENTS,
  WHEEL_TOTAL_WEIGHT,
  createWheelEngine,
  expectedReturn,
  segmentCenterAngle,
  segmentProbability,
  spinRotation,
  type WheelResult,
  type WheelState,
} from "@/games/wheel";
import { createSeededRng } from "@/core/randomness";
import {
  MAX_BET,
  MIN_BET,
  type GameRoundContext,
} from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "wheel", roundId: "round-1", startedAt: 1234 };

function state(result: WheelResult): WheelState {
  return {
    roundId: "round-1",
    startedAt: 1234,
    wager: result.wager,
    segment: result.segment,
    finished: false,
    cashedOut: false,
  };
}

describe("WheelConfig", () => {
  it("offers a fixed wedge table", () => {
    expect(WHEEL_SEGMENTS.length).toBeGreaterThan(2);
    for (const segment of WHEEL_SEGMENTS) {
      expect(segment.weight).toBeGreaterThan(0);
      expect(segment.multiplier).toBeGreaterThanOrEqual(0);
    }
  });

  it("has weights that sum to a clean 100 units", () => {
    expect(WHEEL_TOTAL_WEIGHT).toBe(100);
  });

  it("pays house-edge 1% on average", () => {
    expect(expectedReturn()).toBeCloseTo(1 - HOUSE_EDGE, 9);
  });

  it("derives probabilities from the arc share", () => {
    let total = 0;
    for (let index = 0; index < WHEEL_SEGMENTS.length; index += 1) {
      expect(segmentProbability(index)).toBe(
        (WHEEL_SEGMENTS[index]?.weight ?? 0) / 100,
      );
      total += segmentProbability(index);
    }
    expect(total).toBe(1);
  });

  it("keeps a losing wedge and winning wedges in the table", () => {
    expect(segmentProbability(0)).toBe(0.63);
    expect(segmentProbability(1)).toBe(0.29);
    expect(segmentProbability(2)).toBe(0.06);
    expect(segmentProbability(3)).toBe(0.02);
  });
});

describe("WheelEngine beginRound", () => {
  const engine = createWheelEngine(createSeededRng("wheel"));

  it("rejects a missing payload", () => {
    expect(() => engine.beginRound(ctx)).toThrow();
    expect(() => engine.beginRound(ctx, {})).toThrow("wager is required.");
  });

  it("rejects non-whole wagers", () => {
    expect(() => engine.beginRound(ctx, { wager: 100.9 })).toThrow(
      "wager must be a whole number",
    );
  });

  it("rejects wagers outside the shared range", () => {
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1 })).toThrow("between");
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1 })).toThrow("between");
  });

  it("tracks the wager and draws a segment within range", () => {
    for (let iteration = 0; iteration < 60; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100 });
      expect(round.wager).toBe(100);
      expect(round.segment).toBeGreaterThanOrEqual(0);
      expect(round.segment).toBeLessThan(WHEEL_SEGMENTS.length);
    }
  });

  it("hits the common zero wedge often and the jackpot rarely", () => {
    const spins = 400;
    let zeros = 0;
    let jackpots = 0;
    for (let iteration = 0; iteration < spins; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100 });
      if (round.segment === 0) zeros += 1;
      if (round.segment === 3) jackpots += 1;
    }
    expect(zeros / spins).toBeGreaterThan(0.5);
    expect(jackpots / spins).toBeLessThan(0.1);
  });
});

describe("WheelEngine finishRound", () => {
  const engine = createWheelEngine(createSeededRng("wheel"));

  it("settles every stop against its wedge multiplier", () => {
    for (let iteration = 0; iteration < 200; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100 });
      const result = engine.finishRound(ctx, round);
      const multiplier = WHEEL_SEGMENTS[round.segment]?.multiplier ?? 0;
      expect(result.multiplier).toBe(multiplier);
      expect(result.outcome).toBe(multiplier > 0 ? "win" : "zero");
      expect(result.payout).toBe(Math.floor(100 * multiplier));
    }
  });

  it("pays nothing on a zero stop", () => {
    let round = engine.beginRound(ctx, { wager: 250 });
    let guard = 0;
    while (round.segment !== 0 && guard < 8_000) {
      round = engine.beginRound(ctx, { wager: 250 });
      guard += 1;
    }
    const result = engine.finishRound(ctx, round);
    expect(round.segment).toBe(0);
    expect(result.outcome).toBe("zero");
    expect(result.multiplier).toBe(0);
    expect(result.payout).toBe(0);
  });

  it("is idempotent", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    expect(engine.finishRound(ctx, round)).toEqual(engine.finishRound(ctx, round));
  });

  it("mirrors the result payload on the flyout result state", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    const result = engine.finishRound(ctx, round);
    expect(engine.finishRound(ctx, state(result))).toEqual(result);
  });
});

describe("WheelEngine determinism", () => {
  it("reproduces the same stop for a seed", () => {
    const first = createWheelEngine(createSeededRng("spinner"));
    const second = createWheelEngine(createSeededRng("spinner"));
    const spinA = first.beginRound(ctx, { wager: 100 });
    const spinB = second.beginRound(ctx, { wager: 100 });
    expect(spinA.segment).toBe(spinB.segment);
    expect(first.finishRound(ctx, spinA)).toEqual(second.finishRound(ctx, spinB));
  });

  it("produces varied stops across seeds", () => {
    const segments = new Set<number>();
    for (let i = 0; i < 100; i += 1) {
      const engine = createWheelEngine(createSeededRng(`spin-${i}`));
      const round = engine.beginRound(ctx, { wager: 100 });
      segments.add(round.segment);
    }
    expect(segments.size).toBeGreaterThan(2);
  });
});

describe("WheelSpin", () => {
  it("orders wedge arcs so the top pointer falls on the engine stop", () => {
    for (let index = 0; index < WHEEL_SEGMENTS.length; index += 1) {
      for (const from of [0, 10, 90, 180, 271, 359, 720, 953]) {
        const rotation = spinRotation(from, index);
        const landing = ((rotation + segmentCenterAngle(index)) % 360 + 360) % 360;
        expect(landing).toBe(0);
        expect(rotation).toBeGreaterThan(from);
      }
    }
  });

  it("spins five full turns before settling", () => {
    expect(spinRotation(0, 2) - 0).toBeGreaterThan(360 * 5);
    expect(spinRotation(0, 2)).toBeLessThan(360 * 5 + 360);
  });
});