import { describe, expect, it } from "vitest";
import {
  BlackjackEngine,
  cardValue,
  createBlackjackEngine,
  handValue,
  isBust,
  isNatural,
  type BetHand,
  type BlackjackState,
  type Card,
} from "@/games/blackjack";
import { createSeededRng } from "@/core/randomness";
import type { GameRoundContext } from "@/core/game-engine";

const ctx: GameRoundContext = { gameId: "blackjack", roundId: "round-1", startedAt: 1234 };

const S = (rank: Card["rank"], suit: Card["suit"] = "spades"): Card => ({ rank, suit });

function makeState(over: Partial<BlackjackState>): BlackjackState {
  return {
    roundId: "round-1",
    startedAt: 1234,
    shoe: [],
    dealer: [],
    hands: [],
    activeHand: 0,
    stake: 0,
    ...over,
  };
}

function done(bet: number, cards: Card[], extra: Partial<BetHand> = {}): BetHand {
  return { cards, bet, doubled: false, split: false, done: true, ...extra };
}

describe("blackjack cards", () => {
  it("valorizes ranks", () => {
    expect(cardValue("A")).toBe(11);
    expect(cardValue("K")).toBe(10);
    expect(cardValue("Q")).toBe(10);
    expect(cardValue("J")).toBe(10);
    expect(cardValue("10")).toBe(10);
    expect(cardValue("7")).toBe(7);
  });

  it("computes hard and soft totals", () => {
    expect(handValue([S("9"), S("7")]).total).toBe(16);
    expect(handValue([S("A"), S("6")])).toEqual({ total: 17, soft: true });
    expect(handValue([S("A"), S("K")]).total).toBe(21);
    expect(handValue([S("A"), S("A"), S("K")]).total).toBe(12);
  });

  it("detects busts and naturals", () => {
    expect(isBust([S("K"), S("K"), S("5")])).toBe(true);
    expect(isBust([S("K"), S("K")])).toBe(false);
    expect(isNatural([S("A"), S("K")])).toBe(true);
    expect(isNatural([S("K"), S("K")])).toBe(false);
    expect(isNatural([S("A"), S("Q")])).toBe(true);
    expect(isNatural([S("10"), S("K")])).toBe(false);
  });
});

describe("BlackjackEngine beginRound", () => {
  it("exposes identity and version", () => {
    const engine = createBlackjackEngine(createSeededRng("x"));
    expect(engine.gameId).toBe("blackjack");
    expect(engine.version).toBe("1.0.0");
  });

  it("deals two cards to dealer and player and commits the wager", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = engine.beginRound(ctx, { wager: 500 });
    expect(state.dealer).toHaveLength(2);
    expect(state.hands).toHaveLength(1);
    expect(state.hands[0]?.cards).toHaveLength(2);
    expect(state.hands[0]?.bet).toBe(500);
    expect(state.stake).toBe(500);
    expect(state.shoe.length).toBe(6 * 52 - 4);
  });

  it("starts the hand as finished when dealt a natural", () => {
    const engine = new BlackjackEngine({ next: () => 0 });
    const state = engine.beginRound(ctx, { wager: 100 });
    expect(state.hands[0]?.done).toBe(state.hands[0] && isNatural(state.hands[0].cards) ? true : false);
  });

  it("rejects invalid wagers", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    for (const wager of [0, -100, 99, 100_001, 100.5, Number.NaN, undefined]) {
      expect(() => engine.beginRound(ctx, { wager })).toThrow(/wager/);
    }
  });

  it("is deterministic when seeded identically", () => {
    const a = createBlackjackEngine(createSeededRng("seed-1")).beginRound(ctx, { wager: 100 });
    const b = createBlackjackEngine(createSeededRng("seed-1")).beginRound(ctx, { wager: 100 });
    expect(a.dealer).toEqual(b.dealer);
    expect(a.hands).toEqual(b.hands);
    expect(a.shoe).toEqual(b.shoe);
  });
});

describe("BlackjackEngine actions", () => {
  it("hit draws a card for the active hand", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs"), S("6", "hearts")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("K", "hearts"), S("5", "clubs")], { done: false })],
    });
    const next = engine.hit(ctx, state);
    expect(next.hands[0]?.cards).toEqual([S("K", "hearts"), S("5", "clubs"), S("6", "hearts")]);
    expect(next.hands[0]?.done).toBe(true);
    expect(next.shoe).toEqual([S("K", "clubs")]);
  });

  it("bust marks the hand finished", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "hearts")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("K", "clubs"), S("6", "spades")], { done: false })],
    });
    const next = engine.hit(ctx, state);
    expect(isBust(next.hands[0]!.cards)).toBe(true);
    expect(next.hands[0]?.done).toBe(true);
  });

  it("stand finishes the hand without drawing", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("10", "hearts"), S("9", "clubs")], { done: false })],
    });
    const next = engine.stand(ctx, state);
    expect(next.hands[0]?.done).toBe(true);
    expect(next.hands[0]?.cards).toHaveLength(2);
    expect(next.shoe).toEqual([S("K", "clubs")]);
  });

  it("rejects actions on a finished hand", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("10"), S("9")])],
    });
    expect(() => engine.hit(ctx, state)).toThrow(/finished/);
    expect(() => engine.stand(ctx, state)).toThrow(/finished/);
  });

  it("double draws exactly one card and doubles the stake", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs"), S("3", "hearts")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("10", "hearts"), S("7", "clubs")], { done: false })],
      stake: 500,
    });
    const next = engine.double(ctx, state);
    expect(next.hands[0]?.cards).toEqual([S("10", "hearts"), S("7", "clubs"), S("3", "hearts")]);
    expect(next.hands[0]?.doubled).toBe(true);
    expect(next.hands[0]?.done).toBe(true);
    expect(next.stake).toBe(1000);
  });

  it("double is only available on two cards", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("10"), S("7"), S("4")], { done: false })],
    });
    expect(() => engine.double(ctx, state)).toThrow(/two cards/);
  });

  it("split creates two hands and adds another wager", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("A", "diamonds"), S("K", "spades")],
      dealer: [S("10", "clubs"), S("9", "hearts")],
      hands: [done(500, [S("9", "spades"), S("9", "clubs")], { done: false })],
      stake: 500,
    });
    const next = engine.split(ctx, state);
    expect(next.hands).toHaveLength(2);
    expect(next.hands[0]?.cards).toEqual([S("9", "spades"), S("K", "spades")]);
    expect(next.hands[1]?.cards).toEqual([S("9", "clubs"), S("A", "diamonds")]);
    expect(next.hands[0]?.split).toBe(true);
    expect(next.hands[0]?.bet).toBe(500);
    expect(next.stake).toBe(1000);
    expect(next.activeHand).toBe(0);
  });

  it("split rejects non-pairs and repeated splits", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const nonPair = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("9"), S("8")], { done: false })],
    });
    expect(() => engine.split(ctx, nonPair)).toThrow(/pair/);

    const single = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("10"), S("8")],
      hands: [done(500, [S("9"), S("9")], { done: false })],
    });
    const split = engine.split(ctx, single);
    expect(() => engine.split(ctx, split)).toThrow(/once/);
  });

  it("advances to the next hand after a stand", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs"), S("A", "diamonds")],
      dealer: [S("10"), S("8")],
      hands: [
        done(500, [S("9", "spades"), S("K", "spades")], { done: false, split: true }),
        done(500, [S("9", "clubs"), S("A", "diamonds")], { done: false, split: true }),
      ],
      stake: 1000,
    });
    const afterFirst = engine.stand(ctx, state);
    expect(afterFirst.activeHand).toBe(1);
    expect(engine.hit(ctx, afterFirst).hands[1]?.cards).toHaveLength(3);
  });
});

describe("BlackjackEngine finishRound", () => {
  it("requires all player hands to be finished", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("10", "clubs"), S("9", "hearts")],
      hands: [done(500, [S("10"), S("9")], { done: false })],
    });
    expect(() => engine.finishRound(ctx, state)).toThrow(/finish/);
  });

  it("pays even money on a plain win", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("10", "clubs"), S("8", "hearts")],
      hands: [done(500, [S("10", "spades"), S("9", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("win");
    expect(result.winPayout).toBe(1000);
    expect(result.pushRefund).toBe(0);
    expect(result.blackjack).toBe(false);
  });

  it("marks a tie as a push and refunds the stake", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("9", "clubs"), S("10", "hearts")],
      hands: [done(500, [S("10", "spades"), S("9", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("push");
    expect(result.winPayout).toBe(0);
    expect(result.pushRefund).toBe(500);
  });

  it("does not pay a losing hand", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("10", "clubs"), S("8", "hearts")],
      hands: [done(500, [S("10", "spades"), S("7", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("loss");
    expect(result.winPayout).toBe(0);
    expect(result.pushRefund).toBe(0);
  });

  it("pays 3 to 2 on a natural blackjack", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("9", "clubs"), S("8", "hearts")],
      hands: [done(500, [S("A", "spades"), S("K", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("win");
    expect(result.blackjack).toBe(true);
    expect(result.winPayout).toBe(1250);
  });

  it("pushes a player natural against a dealer natural", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("A", "clubs"), S("Q", "hearts")],
      hands: [done(500, [S("A", "spades"), S("K", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("push");
    expect(result.blackjack).toBe(false);
    expect(result.pushRefund).toBe(500);
  });

  it("pays a doubled hand at twice the effective wager", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("10", "clubs"), S("9", "hearts")],
      hands: [
        done(
          500,
          [S("10", "spades"), S("7", "clubs"), S("4", "hearts")],
          { doubled: true },
        ),
      ],
      stake: 1000,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("win");
    expect(result.winPayout).toBe(2000);
  });

  it("wins every split hand against a busted dealer at even money", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "diamonds")],
      dealer: [S("10", "clubs"), S("6", "hearts")],
      hands: [
        done(500, [S("10", "spades"), S("K", "spades")], { split: true }),
        done(500, [S("10", "diamonds"), S("Q", "hearts")], { split: true }),
      ],
      stake: 1000,
    });
    const result = engine.finishRound(ctx, state);
    expect(isBust(result.dealer)).toBe(true);
    expect(result.outcome).toBe("win");
    expect(result.blackjack).toBe(false);
    expect(result.winPayout).toBe(2000);
  });

  it("settles two split hands independently", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      dealer: [S("10", "clubs"), S("9", "hearts")],
      hands: [
        done(500, [S("9", "spades"), S("K", "spades")], { split: true }),
        done(500, [S("9", "clubs"), S("A", "diamonds")], { split: true }),
      ],
      stake: 1000,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.outcome).toBe("win");
    expect(result.winPayout).toBe(1000);
    expect(result.pushRefund).toBe(500);
  });

  it("stands on soft 17 (S17)", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("K", "clubs")],
      dealer: [S("A", "hearts"), S("6", "clubs")],
      hands: [done(500, [S("10", "spades"), S("9", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(handValue(result.dealer).total).toBe(17);
    expect(result.dealer).toHaveLength(2);
    expect(result.outcome).toBe("win");
  });

  it("draws the dealer to at least a hard 17", () => {
    const engine = new BlackjackEngine({ next: () => 0.5 });
    const state = makeState({
      shoe: [S("A", "diamonds")],
      dealer: [S("10", "clubs"), S("6", "hearts")],
      hands: [done(500, [S("10", "spades"), S("9", "spades")])],
      stake: 500,
    });
    const result = engine.finishRound(ctx, state);
    expect(result.dealer).toHaveLength(3);
    expect(handValue(result.dealer).total).toBeGreaterThanOrEqual(17);
  });
});