import { describe, expect, it } from "vitest";
import {
  RouletteEngine,
  betMatches,
  columnOf,
  createRouletteEngine,
  dozenOf,
  rouletteColor,
  ROULETTE_MULTIPLIERS,
} from "@/games/roulette";
import { createSeededRng } from "@/core/randomness";
import type { GameRoundContext } from "@/core/game-engine";
import type { RouletteBet } from "@/games/roulette";

const ctx: GameRoundContext = {
  gameId: "roulette",
  roundId: "roulette-1",
  startedAt: 1234,
};

function bet(partial: Partial<RouletteBet> & Pick<RouletteBet, "kind" | "wager">): RouletteBet {
  return { id: "b", target: null, ...partial };
}

describe("roulette board", () => {
  it("assigns the European wheel colours", () => {
    expect(rouletteColor(0)).toBe("green");
    expect(rouletteColor(1)).toBe("red");
    expect(rouletteColor(2)).toBe("black");
    expect(rouletteColor(11)).toBe("black");
    expect(rouletteColor(19)).toBe("red");
    expect(rouletteColor(29)).toBe("black");
    expect(rouletteColor(30)).toBe("red");
    expect(rouletteColor(36)).toBe("red");
  });

  it("maps dozens and columns", () => {
    expect(dozenOf(0)).toBeNull();
    expect(dozenOf(1)).toBe(1);
    expect(dozenOf(12)).toBe(1);
    expect(dozenOf(13)).toBe(2);
    expect(dozenOf(24)).toBe(2);
    expect(dozenOf(25)).toBe(3);
    expect(dozenOf(36)).toBe(3);
    expect(columnOf(0)).toBeNull();
    expect(columnOf(1)).toBe(1);
    expect(columnOf(3)).toBe(3);
    expect(columnOf(4)).toBe(1);
    expect(columnOf(17)).toBe(2);
    expect(columnOf(36)).toBe(3);
  });

  it("exposes even-money and weighted payouts", () => {
    expect(ROULETTE_MULTIPLIERS.straight).toBe(36);
    expect(ROULETTE_MULTIPLIERS.red).toBe(2);
    expect(ROULETTE_MULTIPLIERS.odd).toBe(2);
    expect(ROULETTE_MULTIPLIERS.dozen).toBe(3);
    expect(ROULETTE_MULTIPLIERS.column).toBe(3);
  });

  it("resolves outside bets against 18", () => {
    expect(betMatches(bet({ kind: "straight", target: 18, wager: 100 }), 18)).toBe(true);
    expect(betMatches(bet({ kind: "straight", target: 18, wager: 100 }), 17)).toBe(false);
    expect(betMatches(bet({ kind: "red", wager: 100 }), 18)).toBe(true);
    expect(betMatches(bet({ kind: "red", wager: 100 }), 17)).toBe(false);
    expect(betMatches(bet({ kind: "red", wager: 100 }), 0)).toBe(false);
    expect(betMatches(bet({ kind: "black", wager: 100 }), 17)).toBe(true);
    expect(betMatches(bet({ kind: "even", wager: 100 }), 18)).toBe(true);
    expect(betMatches(bet({ kind: "odd", wager: 100 }), 0)).toBe(false);
    expect(betMatches(bet({ kind: "low", wager: 100 }), 18)).toBe(true);
    expect(betMatches(bet({ kind: "high", wager: 100 }), 18)).toBe(false);
    expect(betMatches(bet({ kind: "high", wager: 100 }), 19)).toBe(true);
    expect(betMatches(bet({ kind: "dozen", target: 2, wager: 100 }), 18)).toBe(true);
    expect(betMatches(bet({ kind: "dozen", target: 2, wager: 100 }), 24)).toBe(true);
    expect(betMatches(bet({ kind: "dozen", target: 2, wager: 100 }), 20)).toBe(true);
    expect(betMatches(bet({ kind: "dozen", target: 2, wager: 100 }), 0)).toBe(false);
    expect(betMatches(bet({ kind: "column", target: 3, wager: 100 }), 3)).toBe(true);
    expect(betMatches(bet({ kind: "column", target: 3, wager: 100 }), 36)).toBe(true);
    expect(betMatches(bet({ kind: "column", target: 2, wager: 100 }), 17)).toBe(true);
  });
});

describe("RouletteEngine", () => {
  it("exposes identity and version", () => {
    const engine = createRouletteEngine(createSeededRng("roulette"));
    expect(engine.gameId).toBe("roulette");
    expect(engine.version).toBe("1.0.0");
  });

  it("begins a round and sums the total wager", () => {
    const engine = new RouletteEngine({ next: () => 0 });
    const state = engine.beginRound(ctx, {
      bets: [bet({ kind: "red", wager: 100 }), bet({ kind: "straight", target: 7, wager: 500 })],
    });
    expect(state.totalWager).toBe(600);
    expect(state.bets).toHaveLength(2);
  });

  it("rejects an empty round", () => {
    const engine = new RouletteEngine({ next: () => 0 });
    expect(() => engine.beginRound(ctx, { bets: [] })).toThrow(/Place at least one bet/);
  });

  it("rejects malformed wagers, kinds, and targets", () => {
    const engine = new RouletteEngine({ next: () => 0 });
    const invalid = [
      bet({ kind: "red", wager: 0 }),
      bet({ kind: "red", wager: -100 }),
      bet({ kind: "red", wager: 99 }),
      bet({ kind: "red", wager: 100_001 }),
      bet({ kind: "red", wager: 50.5 }),
      bet({ kind: "bogus" as never, wager: 100 }),
      bet({ kind: "straight", target: 37, wager: 100 }),
      bet({ kind: "straight", target: -1, wager: 100 }),
      bet({ kind: "straight", wager: 100 }),
      bet({ kind: "dozen", target: 4, wager: 100 }),
      bet({ kind: "column", target: 0, wager: 100 }),
      bet({ kind: "red", target: 7, wager: 100 }),
    ];
    for (const item of invalid) {
      expect(() => engine.beginRound(ctx, { bets: [item] })).toThrow();
    }
  });

  it("pays every matching bet when the ball lands on 18", () => {
    const engine = new RouletteEngine({ next: () => 18.5 / 37 });
    const bets: RouletteBet[] = [
      bet({ kind: "straight", target: 18, wager: 100 }),
      bet({ kind: "red", wager: 200 }),
      bet({ kind: "even", wager: 100 }),
      bet({ kind: "low", wager: 100 }),
      bet({ kind: "high", wager: 100 }),
      bet({ kind: "dozen", target: 2, wager: 100 }),
      bet({ kind: "column", target: 3, wager: 100 }),
    ];
    const state = engine.beginRound(ctx, { bets });
    const result = engine.finishRound(ctx, state);
    expect(result.number).toBe(18);
    expect(result.color).toBe("red");
    expect(result.totalPayout).toBe(100 * 36 + 200 * 2 + 100 * 2 + 100 * 2 + 100 * 3 + 100 * 3);
    const outcomes = Object.fromEntries(result.bets.map((o) => [o.bet.kind + (o.bet.target ?? ""), o.paid]));
    expect(outcomes["straight18"]).toBe(true);
    expect(outcomes["red"]).toBe(true);
    expect(outcomes["even"]).toBe(true);
    expect(outcomes["low"]).toBe(true);
    expect(outcomes["high"]).toBe(false);
    expect(outcomes["dozen2"]).toBe(true);
    expect(outcomes["column3"]).toBe(true);
  });

  it("pays straight zero and nothing else when the ball hits zero", () => {
    const engine = new RouletteEngine({ next: () => 0.1 / 37 });
    const state = engine.beginRound(ctx, {
      bets: [
        bet({ kind: "straight", target: 0, wager: 100 }),
        bet({ kind: "black", wager: 100 }),
        bet({ kind: "low", wager: 100 }),
        bet({ kind: "even", wager: 100 }),
      ],
    });
    const result = engine.finishRound(ctx, state);
    expect(result.number).toBe(0);
    expect(result.color).toBe("green");
    expect(result.totalPayout).toBe(100 * 36);
  });

  it("is deterministic for a seeded rng", () => {
    const a = createRouletteEngine(createSeededRng("spin-42"));
    const b = createRouletteEngine(createSeededRng("spin-42"));
    const run = (engine: RouletteEngine) => {
      const state = engine.beginRound(ctx, { bets: [bet({ kind: "red", wager: 100 })] });
      return engine.finishRound(ctx, state);
    };
    expect(run(a)).toEqual(run(b));
  });
});