import { describe, expect, it } from "vitest";
import type { EconomyTransaction, TransactionType } from "@/core/economy";
import { buildBalanceSeries, computeActivityStats, percent } from "@/lib/stats";

function txn(
  id: string,
  type: TransactionType,
  change: number,
  overrides: Partial<EconomyTransaction> = {},
): EconomyTransaction {
  let previousBalance = 0;
  let newBalance = change;
  if (overrides.newBalance !== undefined) {
    newBalance = overrides.newBalance;
    previousBalance = newBalance - change;
  }
  return {
    id,
    type,
    timestamp: Number(id),
    previousBalance,
    change,
    newBalance,
    gameId: overrides.gameId,
    roundId: overrides.roundId,
    note: overrides.note,
  };
}

describe("activity statistics", () => {
  it("aggregates wagers, payouts, rounds, and win rate", () => {
    const balance = 25000;
    const stats = computeActivityStats([
      txn("1", "initial-allocation", 25000, { newBalance: balance }),
      txn("2", "bet", -500, { gameId: "slots", roundId: "r1", previousBalance: balance, newBalance: balance - 500 }),
      txn("3", "win", 1200, { gameId: "slots", roundId: "r1", previousBalance: balance - 500, newBalance: balance + 700 }),
      txn("4", "bet", -300, { gameId: "dice", roundId: "r2", previousBalance: balance + 700, newBalance: balance + 400 }),
    ]);

    expect(stats.highlights.wagers).toBe(800);
    expect(stats.highlights.payouts).toBe(1200);
    expect(stats.highlights.rounds).toBe(2);
    expect(stats.highlights.winRate).toBe(0.5);
    expect(stats.highlights.net).toBe(25400);
    expect(stats.highlights.largestWin).toBe(1200);
    expect(stats.highlights.largestLoss).toBe(-500);
  });

  it("computes per-game net and return rate, sorted highest net first", () => {
    const stats = computeActivityStats([
      txn("1", "bet", -500, { gameId: "slots", roundId: "a", previousBalance: 25000, newBalance: 24500 }),
      txn("2", "win", 1200, { gameId: "slots", roundId: "a", previousBalance: 24500, newBalance: 25700 }),
      txn("3", "bet", -300, { gameId: "dice", roundId: "b", previousBalance: 25700, newBalance: 25400 }),
    ]);

    expect(stats.perGame).toHaveLength(2);
    expect(stats.perGame[0]?.gameId).toBe("slots");
    expect(stats.perGame[0]?.net).toBe(700);
    expect(stats.perGame[0]?.returnRate).toBe(2.4);
    expect(stats.perGame[0]?.rounds).toBe(1);
    expect(stats.perGame[0]?.name).toBe("Slots");
    expect(stats.perGame[1]?.gameId).toBe("dice");
    expect(stats.perGame[1]?.net).toBe(-300);
    expect(stats.perGame[1]?.returnRate).toBe(0);
  });

  it("names the best and worst games and best-return game", () => {
    const stats = computeActivityStats([
      txn("1", "bet", -500, { gameId: "slots", roundId: "a", previousBalance: 25000, newBalance: 24500 }),
      txn("2", "win", 1200, { gameId: "slots", roundId: "a", previousBalance: 24500, newBalance: 25700 }),
      txn("3", "bet", -1000, { gameId: "blackjack", roundId: "b", previousBalance: 25700, newBalance: 24700 }),
      txn("4", "bet", -200, { gameId: "coin-flip", roundId: "c", previousBalance: 24700, newBalance: 24500 }),
      txn("5", "win", 210, { gameId: "coin-flip", roundId: "c", previousBalance: 24500, newBalance: 24710 }),
    ]);

    expect(stats.highlights.bestGame?.gameId).toBe("slots");
    expect(stats.highlights.bestGame?.net).toBe(700);
    expect(stats.highlights.worstGame?.gameId).toBe("blackjack");
    expect(stats.highlights.worstGame?.net).toBe(-1000);
    expect(stats.highlights.bestReturnGame?.gameId).toBe("slots");
    expect(stats.highlights.bestReturnGame?.returnRate).toBeCloseTo(2.4);
  });

  it("finds the most profitable round", () => {
    const stats = computeActivityStats([
      txn("1", "bet", -500, { gameId: "slots", roundId: "a", previousBalance: 25000, newBalance: 24500 }),
      txn("2", "win", 1200, { gameId: "slots", roundId: "a", previousBalance: 24500, newBalance: 25700 }),
      txn("3", "bet", -300, { gameId: "dice", roundId: "b", previousBalance: 25700, newBalance: 25400 }),
      txn("4", "win", 400, { gameId: "dice", roundId: "b", previousBalance: 25400, newBalance: 25800 }),
    ]);

    expect(stats.highlights.bestRound?.key).toBe("slots:a");
    expect(stats.highlights.bestRound?.change).toBe(700);
  });

  it("returns nulls and zeros for an empty ledger", () => {
    const stats = computeActivityStats([]);
    expect(stats.highlights.wagers).toBe(0);
    expect(stats.highlights.net).toBe(0);
    expect(stats.highlights.winRate).toBe(0);
    expect(stats.highlights.bestReturnGame).toBeNull();
    expect(stats.highlights.bestGame).toBeNull();
    expect(stats.highlights.worstGame).toBeNull();
    expect(stats.highlights.bestRound).toBeNull();
    expect(stats.perGame).toEqual([]);
    expect(stats.balanceSeries).toEqual([]);
  });
});

describe("balance series", () => {
  it("returns chronological points, oldest first, ending on the newest", () => {
    const series = buildBalanceSeries([
      txn("103", "win", 130, { newBalance: 450 }),
      txn("102", "bet", -20, { newBalance: 320 }),
      txn("101", "win", 100, { newBalance: 300 }),
    ]);
    expect(series.map((point) => point.balance)).toEqual([300, 320, 450]);
    expect(series[0]?.timestamp).toBe(101);
    expect(series[2]?.timestamp).toBe(103);
  });

  it("caps the point count while preserving the newest balance", () => {
    const transactions = Array.from({ length: 100 }, (_, index) => {
      const balance = 99 - index;
      return txn(String(99 - index), "bet", -1, { newBalance: balance });
    });
    const series = buildBalanceSeries(transactions, 24);
    expect(series.length).toBeLessThanOrEqual(26);
    expect(series[series.length - 1]?.balance).toBe(99);
  });
});

describe("percent formatting", () => {
  it("rounds to one decimal", () => {
    expect(percent(0.5)).toBe("50%");
    expect(percent(0.6666)).toBe("66.7%");
  });
});