import { describe, expect, it } from "vitest";
import {
  HOUSE_EDGE,
  MAX_MULTIPLIER,
  createCrashEngine,
  multiplierAt,
  roundMultiplier,
  type CrashState,
} from "@/games/crash";
import { createSeededRng, type Rng } from "@/core/randomness";
import {
  MAX_BET,
  MIN_BET,
  type GameRoundContext,
} from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "crash", roundId: "round-1", startedAt: 1234 };

/** Any x in [0,1) forces a desired crash point via x = (1-edge)/target. */
function forceMultiplier(target: number): number {
  return (1 - HOUSE_EDGE) / Math.min(target, MAX_MULTIPLIER);
}

function scripted(values: readonly number[]): Rng {
  const queue = [...values];
  return { next: () => queue.shift() ?? forceMultiplier(2) };
}

function state(crashPoint: number, wager = 100): CrashState {
  return { roundId: "round-1", startedAt: 1234, wager, crashPoint };
}

describe("crash curve", () => {
  it("starts at 1 and rises exponentially", () => {
    expect(multiplierAt(0)).toBe(1);
    const next = multiplierAt(1000);
    expect(next).toBeGreaterThan(1);
    expect(multiplierAt(2000)).toBeGreaterThan(next);
  });

  it("rounds multipliers to two decimals", () => {
    expect(roundMultiplier(1.98765)).toBe(1.98);
    expect(roundMultiplier(1)).toBe(1);
  });
});

describe("CrashEngine beginRound", () => {
  it("exposes identity and version", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("crash");
    expect(engine.version).toBe("1.0.0");
  });

  it("accepts a valid wager and decides a crash point from the rng", () => {
    const engine = createCrashEngine(scripted([forceMultiplier(2.5)]));
    const s = engine.beginRound(ctx, { wager: 500 });
    expect(s.wager).toBe(500);
    expect(s.crashPoint).toBe(2.5);
  });

  it("rejects a missing wager", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, {})).toThrow(/wager/);
  });

  it("rejects a fractional wager", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: 100.5 })).toThrow(/whole number/);
  });

  it("rejects wagers outside the allowed range", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1 })).toThrow(/between/);
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1 })).toThrow(/between/);
  });
});

describe("CrashEngine crash points", () => {
  it("bakes the house edge into the smallest point", () => {
    const engine = createCrashEngine(scripted([0.99]));
    expect(engine.beginRound(ctx, { wager: 100 }).crashPoint).toBe(1);
  });

  it("resolves mid-range points to two decimals", () => {
    const engine = createCrashEngine(scripted([0.5]));
    expect(engine.beginRound(ctx, { wager: 100 }).crashPoint).toBe(1.98);
  });

  it("reaches large multipliers from small draws", () => {
    const engine = createCrashEngine(scripted([0.0005]));
    expect(engine.beginRound(ctx, { wager: 100 }).crashPoint).toBe(MAX_MULTIPLIER);
  });

  it("is deterministic under a seeded rng", () => {
    const a = createCrashEngine(createSeededRng("round-7000"));
    const b = createCrashEngine(createSeededRng("round-7000"));
    expect(a.beginRound(ctx, { wager: 1000 })).toEqual(b.beginRound(ctx, { wager: 1000 }));
  });
});

describe("CrashEngine cashOut", () => {
  it("pays floor(wager x multiplier) when the bus is below its point", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    const result = engine.cashOut(state(2.5), 1.98);
    expect(result).toMatchObject({
      outcome: "win",
      cashedOut: true,
      payout: 198,
      multiplier: 1.98,
    });
  });

  it("refuses a cash-out at or past the crash point", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    expect(engine.cashOut(state(1.5), 1.5)).toMatchObject({
      outcome: "crash",
      cashedOut: false,
      payout: 0,
    });
    expect(engine.cashOut(state(1.5), 1.61)).toMatchObject({
      outcome: "crash",
      payout: 0,
    });
  });

  it("refuses a cash-out below 1", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    const result = engine.cashOut(state(1.5), 0.99);
    expect(result.outcome).toBe("crash");
  });

  it("floors the payout to whole credits", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    const result = engine.cashOut(state(1.5), 1.37);
    expect(result.payout).toBe(100 * 1.37);
  });

  it("records the crash point it settled against", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    const result = engine.cashOut(state(3.01), 2);
    expect(result.crashPoint).toBe(3.01);
  });
});

describe("CrashEngine settle", () => {
  it("finishRound always settles as a crash at the point", () => {
    const engine = createCrashEngine(createSeededRng("x"));
    const result = engine.finishRound(ctx, state(2.01));
    expect(result).toMatchObject({
      outcome: "crash",
      cashedOut: false,
      multiplier: 2.01,
      crashPoint: 2.01,
      payout: 0,
    });
  });
});