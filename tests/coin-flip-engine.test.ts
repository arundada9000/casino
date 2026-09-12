import { describe, expect, it } from "vitest";
import {
  COIN_FLIP_MULTIPLIER,
  CoinFlipEngine,
  createCoinFlipEngine,
} from "@/games/coin-flip";
import { createSeededRng } from "@/core/randomness";
import type { GameRoundContext } from "@/core/game-engine";

const ctx: GameRoundContext = {
  gameId: "coin-flip",
  roundId: "round-1",
  startedAt: 1234,
};

function engineWith(flip: number) {
  return new CoinFlipEngine({ next: () => flip });
}

describe("CoinFlipEngine", () => {
  it("exposes identity and version", () => {
    const engine = createCoinFlipEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("coin-flip");
    expect(engine.version).toBe("1.0.0");
  });

  it("begins a round and keeps the committed wager and pick", () => {
    const engine = engineWith(0.1);
    const state = engine.beginRound(ctx, { wager: 500, picked: "heads" });
    expect(state).toEqual({
      roundId: "round-1",
      wager: 500,
      picked: "heads",
      startedAt: 1234,
    });
  });

  it("rejects an unknown side", () => {
    const engine = engineWith(0.1);
    expect(() => engine.beginRound(ctx, { wager: 100, picked: "up" as never })).toThrow(
      /Pick a side/,
    );
  });

  it("rejects zero, negative, fractional, and out-of-range wagers", () => {
    const engine = engineWith(0.1);
    for (const wager of [0, -100, 99, 100_001, 100.5, Number.NaN]) {
      expect(() =>
        engine.beginRound(ctx, { wager, picked: "heads" }),
      ).toThrow(/Wager/);
    }
  });

  it("accepts the minimum and maximum wager", () => {
    const engine = engineWith(0.1);
    expect(engine.beginRound(ctx, { wager: 100, picked: "heads" }).wager).toBe(100);
    expect(engine.beginRound(ctx, { wager: 100_000, picked: "tails" }).wager).toBe(
      100_000,
    );
  });

  it("reports a win when the called side comes up and pays even money", () => {
    const engine = engineWith(0.1);
    const state = engine.beginRound(ctx, { wager: 1000, picked: "heads" });
    const result = engine.finishRound(ctx, state);
    expect(result).toEqual({
      side: "heads",
      outcome: "win",
      wager: 1000,
      multiplier: COIN_FLIP_MULTIPLIER,
      payout: 2000,
    });
  });

  it("reports a loss with no payout when the other side comes up", () => {
    const engine = engineWith(0.9);
    const state = engine.beginRound(ctx, { wager: 750, picked: "heads" });
    const result = engine.finishRound(ctx, state);
    expect(result.side).toBe("tails");
    expect(result.outcome).toBe("loss");
    expect(result.payout).toBe(0);
  });

  it("is deterministic for a seeded rng", () => {
    const a = createCoinFlipEngine(createSeededRng("golden-flip"));
    const b = createCoinFlipEngine(createSeededRng("golden-flip"));
    const run = (engine: CoinFlipEngine) => {
      const state = engine.beginRound(ctx, { wager: 100, picked: "heads" });
      return engine.finishRound(ctx, state);
    };
    expect(run(a)).toEqual(run(b));
  });
});