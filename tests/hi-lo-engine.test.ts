import { describe, expect, it } from "vitest";
import {
  HOUSE_EDGE,
  RANK_VALUE,
  RANK_VALUES,
  REMAINING,
  cardsAbove,
  cardsBelow,
  cardsEqual,
  createHiLoEngine,
  multiplierFor,
  remainingCards,
  type HiLoPrediction,
  type HiLoResult,
  type HiLoState,
} from "@/games/hi-lo";
import type { Card, Rank } from "@/games/blackjack";
import { createSeededRng } from "@/core/randomness";
import { MAX_BET, MIN_BET, type GameRoundContext } from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "hi-lo", roundId: "round-1", startedAt: 1234 };

const ALL_RANKS: readonly Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function state(result: HiLoResult): HiLoState {
  return {
    roundId: "round-1",
    startedAt: 1234,
    wager: result.wager,
    topCard: result.topCard,
    revealCard: result.revealCard,
    prediction: result.prediction,
    finished: false,
    cashedOut: false,
  };
}

function card(rank: Rank, suit: Card["suit"]): Card {
  return { rank, suit };
}

describe("HiLoConfig", () => {
  it("ranks cards Ace high in playing order", () => {
    expect(RANK_VALUE["2"]).toBe(2);
    expect(RANK_VALUE["10"]).toBe(10);
    expect(RANK_VALUE["J"]).toBe(11);
    expect(RANK_VALUE["Q"]).toBe(12);
    expect(RANK_VALUE["K"]).toBe(13);
    expect(RANK_VALUE["A"]).toBe(14);
    expect(RANK_VALUES.length).toBe(13);
  });

  it("counts the four cards of every higher rank", () => {
    expect(cardsAbove("A")).toBe(0);
    expect(cardsAbove("K")).toBe(4);
    expect(cardsAbove("7")).toBe(28);
    expect(cardsAbove("2")).toBe(48);
  });

  it("counts the four cards of every lower rank", () => {
    expect(cardsBelow("2")).toBe(0);
    expect(cardsBelow("3")).toBe(4);
    expect(cardsBelow("7")).toBe(20);
    expect(cardsBelow("A")).toBe(48);
  });

  it("keeps the deck at 51 cards with exactly three equal ranks left", () => {
    for (const rank of ALL_RANKS) {
      expect(cardsEqual(rank)).toBe(3);
      expect(cardsAbove(rank) + cardsBelow(rank) + cardsEqual(rank)).toBe(REMAINING);
    }
  });

  it("pays the fair odds skimmed by the house edge", () => {
    for (const rank of ALL_RANKS) {
      for (const prediction of ["higher", "lower", "equal"] as const) {
        const remaining = remainingCards(prediction, rank);
        if (remaining === 0) continue;
        const multiplier = multiplierFor(prediction, rank);
        const fair = REMAINING / remaining;
        const skimmed = Math.floor(fair * (1 - HOUSE_EDGE) * 100 + 1e-6) / 100;
        expect(multiplier).toBe(skimmed);
        expect(multiplier).toBeGreaterThanOrEqual(1);
        expect(multiplier).toBeLessThanOrEqual(fair);
      }
    }
  });

  it("never pays an unwinnable direction", () => {
    expect(multiplierFor("higher", "A")).toBe(0);
    expect(multiplierFor("lower", "2")).toBe(0);
    expect(multiplierFor("equal", "2")).toBeGreaterThan(1);
  });

  it("offers a healthy equal-rank jackpot and gentle edges elsewhere", () => {
    expect(multiplierFor("equal", "7")).toBe(16.83);
    expect(multiplierFor("higher", "7")).toBe(1.8);
    expect(multiplierFor("lower", "7")).toBe(2.52);
    expect(multiplierFor("higher", "2")).toBe(1.05);
    expect(multiplierFor("lower", "A")).toBe(1.05);
  });
});

describe("HiLoEngine beginRound", () => {
  const engine = createHiLoEngine(createSeededRng("hi-lo"));

  it("rejects a missing payload and non-whole wagers", () => {
    expect(() => engine.beginRound(ctx)).toThrow("wager is required.");
    expect(() => engine.beginRound(ctx, {})).toThrow("wager is required.");
    expect(() => engine.beginRound(ctx, { wager: 100.9 })).toThrow(
      "wager must be a whole number",
    );
  });

  it("rejects wagers outside the shared range", () => {
    expect(() => engine.beginRound(ctx, { wager: MIN_BET - 1 })).toThrow("between");
    expect(() => engine.beginRound(ctx, { wager: MAX_BET + 1 })).toThrow("between");
  });

  it("deals two distinct cards and waits for the call", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    expect(round.prediction).toBeNull();
    expect(round.topCard).toBeDefined();
    expect(round.revealCard).toBeDefined();
    expect(
      round.topCard.suit === round.revealCard.suit &&
        round.topCard.rank === round.revealCard.rank,
    ).toBe(false);
  });
});

describe("HiLoEngine call", () => {
  const engine = createHiLoEngine(createSeededRng("hi-lo"));

  it("commits a valid prediction without revealing the card", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    const made = engine.call(round, "higher");
    expect(made.prediction).toBe("higher");
    expect(made.revealCard).toEqual(round.revealCard);
  });

  it("rejects an unknown prediction value", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    expect(() => engine.call(round, "exactly")).toThrow(
      "prediction must be higher, lower, or equal",
    );
    expect(() => engine.call(round, null)).toThrow("prediction");
  });

  it("rejects a second call on the same round", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    const made = engine.call(round, "lower");
    expect(() => engine.call(made, "higher")).toThrow("already made");
  });
});

describe("HiLoEngine finishRound", () => {
  const engine = createHiLoEngine(createSeededRng("hi-lo"));

  it("refuses to settle before a call", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    expect(() => engine.finishRound(ctx, round)).toThrow("call higher");
  });

  it("pays a correct call at the rank multiplier and floors the payout", () => {
    for (let iteration = 0; iteration < 200; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100 });
      const prediction = bestCall(round.topCard.rank);
      const made = engine.call(round, prediction);
      const result = engine.finishRound(ctx, made);
      const won = engine.matches(prediction, round.topCard, round.revealCard);
      expect(result.outcome).toBe(won ? "win" : "loss");
      expect(result.multiplier).toBe(
        won ? multiplierFor(prediction, round.topCard.rank) : 0,
      );
      expect(result.payout).toBe(
        won
          ? Math.floor(100 * multiplierFor(prediction, round.topCard.rank))
          : 0,
      );
    }
  });

  it("loses a called direction with no cards left at the edge", () => {
    for (let iteration = 0; iteration < 40; iteration += 1) {
      const round = engine.beginRound(ctx, { wager: 100 });
      const impossible =
        round.topCard.rank === "A" ? "higher" : "lower";
      const made = engine.call(round, impossible);
      if (multiplierFor(impossible, round.topCard.rank) === 0) {
        const result = engine.finishRound(ctx, made);
        expect(result.outcome).toBe("loss");
        expect(result.payout).toBe(0);
      }
    }
  });

  it("is idempotent", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    const made = engine.call(round, "equal");
    expect(engine.finishRound(ctx, made)).toEqual(engine.finishRound(ctx, made));
  });

  it("mirrors the result payload on the flyout result state", () => {
    const round = engine.beginRound(ctx, { wager: 100 });
    const made = engine.call(round, "higher");
    const result = engine.finishRound(ctx, made);
    expect(engine.finishRound(ctx, state(result))).toEqual(result);
  });

  it("resolves reveals strictly by rank magnitude", () => {
    expect(engine.matches("higher", card("2", "spades"), card("3", "hearts"))).toBe(true);
    expect(engine.matches("lower", card("K", "spades"), card("Q", "hearts"))).toBe(true);
    expect(engine.matches("equal", card("9", "spades"), card("9", "hearts"))).toBe(true);
    expect(engine.matches("higher", card("K", "spades"), card("A", "hearts"))).toBe(true);
    expect(engine.matches("higher", card("3", "spades"), card("A", "hearts"))).toBe(true);
    expect(engine.matches("lower", card("K", "spades"), card("7", "hearts"))).toBe(true);
  });
});

describe("HiLoEngine determinism", () => {
  it("reproduces the same shoe for a seed", () => {
    const first = createHiLoEngine(createSeededRng("deal"));
    const second = createHiLoEngine(createSeededRng("deal"));
    const dealA = first.beginRound(ctx, { wager: 100 });
    const dealB = second.beginRound(ctx, { wager: 100 });
    expect(dealA.topCard).toEqual(dealB.topCard);
    expect(dealA.revealCard).toEqual(dealB.revealCard);
    const madeA = first.call(dealA, "higher");
    const madeB = second.call(dealB, "higher");
    expect(first.finishRound(ctx, madeA)).toEqual(second.finishRound(ctx, madeB));
  });

  it("produces varied top cards across seeds", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      const engine = createHiLoEngine(createSeededRng(`deal-${i}`));
      const round = engine.beginRound(ctx, { wager: 100 });
      seen.add(round.topCard.rank);
    }
    expect(seen.size).toBeGreaterThan(6);
  });
});

function bestCall(rank: Rank): HiLoPrediction {
  if (multiplierFor("higher", rank) === 0) return "lower";
  if (multiplierFor("lower", rank) === 0) return "higher";
  return "lower";
}