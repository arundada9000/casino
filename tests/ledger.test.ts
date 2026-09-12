import { describe, expect, it } from "vitest";
import type { EconomyTransaction } from "@/core/economy";
import { relativeTime, ledgerTotals, groupByDay, transactionLabel } from "@/lib/ledger";

const anchor = new Date();
anchor.setHours(12, 0, 0, 0);
const now = anchor.getTime();

describe("ledger helpers", () => {
  it("labels every transaction type", () => {
    expect(transactionLabel("initial-allocation")).toBe("Welcome bonus");
    expect(transactionLabel("bet")).toBe("Bet placed");
    expect(transactionLabel("win")).toBe("Win");
    expect(transactionLabel("debug")).toBe("Debug");
  });

  it("renders friendly relative times", () => {
    expect(relativeTime(now - 20_000, now)).toBe("just now");
    expect(relativeTime(now - 120_000, now)).toBe("2m ago");
    expect(relativeTime(now - 5 * 3_600_000, now)).toBe("5h ago");
    expect(relativeTime(now - 26 * 3_600_000, now)).toBe("yesterday");
  });

  it("sums bets, wins, and net change", () => {
    const totals = ledgerTotals([
      { type: "initial-allocation", change: 25000, newBalance: 25000, id: "1", timestamp: 1, previousBalance: 0 },
      { type: "bet", change: -500, newBalance: 24500, id: "2", timestamp: 2, previousBalance: 25000 },
      { type: "win", change: 1200, newBalance: 25700, id: "3", timestamp: 3, previousBalance: 24500 },
      { type: "bet", change: -300, newBalance: 25400, id: "4", timestamp: 4, previousBalance: 25700 },
    ]);
    expect(totals.totalBets).toBe(800);
    expect(totals.totalWins).toBe(1200);
    expect(totals.net).toBe(25400);
    expect(totals.count).toBe(4);
  });

  it("groups transactions by calendar day, newest first", () => {
    const yesterday = now - 26 * 3_600_000;
    const dayA = new Date(yesterday).setHours(12, 0, 0, 0);
    const txn = (
      id: string,
      timestamp: number,
      change: number,
    ): EconomyTransaction => ({
      id,
      timestamp,
      change,
      type: "bet",
      previousBalance: 0,
      newBalance: change,
    });
    const groups = groupByDay([
      txn("a", now, -100),
      txn("b", now - 3_600_000, 250),
      txn("c", dayA, -50),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Today");
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[1]?.label).toBe("Yesterday");
  });
});