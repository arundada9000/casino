import { describe, expect, it } from "vitest";
import {
  allocateInitialBalance,
  credit,
  debit,
  refund,
  resetBalance,
  validateLedgerState,
  INITIAL_ALLOCATION,
  MAX_BALANCE,
  LEDGER_CAP,
} from "@/core/economy";
import {
  EconomyError,
  InsufficientCreditsError,
} from "@/core/economy/errors";
import { errorCode } from "@/core/error";
import type { EconomyLedgerState } from "@/core/economy";

const emptyState = (): EconomyLedgerState => ({ balance: 0, transactions: [] });

describe("allocateInitialBalance", () => {
  it("allocates the welcome balance and records an initial-allocation transaction", () => {
    const next = allocateInitialBalance(emptyState());
    expect(next.balance).toBe(INITIAL_ALLOCATION);
    expect(next.transactions[0]?.type).toBe("initial-allocation");
    expect(next.transactions[0]?.change).toBe(INITIAL_ALLOCATION);
  });

  it("is a no-op when a balance already exists", () => {
    const seeded = { balance: 500, transactions: [] };
    const next = allocateInitialBalance(seeded);
    expect(next.balance).toBe(500);
    expect(next.transactions).toHaveLength(0);
  });

  it("is a no-op when the ledger already has an allocation", () => {
    const allocated = allocateInitialBalance(emptyState());
    const again = allocateInitialBalance(allocated);
    expect(again.balance).toBe(INITIAL_ALLOCATION);
    expect(again.transactions.filter((t) => t.type === "initial-allocation")).toHaveLength(1);
  });
});

describe("credit", () => {
  it("increases the balance and records the transaction", () => {
    const next = credit(emptyState(), "win", 1_000, { gameId: "roulette", roundId: "r1" });
    expect(next.balance).toBe(1_000);
    const txn = next.transactions[0];
    expect(txn).toMatchObject({
      type: "win",
      previousBalance: 0,
      change: 1_000,
      newBalance: 1_000,
      gameId: "roulette",
      roundId: "r1",
    });
    expect(typeof txn?.id).toBe("string");
    expect(typeof txn?.timestamp).toBe("number");
  });

  it("rejects non-integer, zero, negative, and non-finite amounts", () => {
    for (const bad of [0, -10, 10.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => credit(emptyState(), "win", bad)).toThrow(EconomyError);
    }
  });

  it("guards against balance overflow", () => {
    const nearMax = {
      balance: MAX_BALANCE,
      transactions: [],
    };
    expect(() => credit(nearMax, "adjustment", 1)).toThrow(EconomyError);
    let code: string | undefined;
    try {
      credit(nearMax, "adjustment", 1);
    } catch (error) {
      code = errorCode(error);
    }
    expect(code).toBe("economy.overflow");
  });
});

describe("debit", () => {
  it("decreases the balance and records a negative change", () => {
    const start = { balance: 5_000, transactions: [] };
    const next = debit(start, "bet", 500, { gameId: "coin-flip", roundId: "r2" });
    expect(next.balance).toBe(4_500);
    expect(next.transactions[0]).toMatchObject({
      type: "bet",
      previousBalance: 5_000,
      change: -500,
      newBalance: 4_500,
    });
  });

  it("throws when the balance would go below zero", () => {
    const start = { balance: 100, transactions: [] };
    expect(() => debit(start, "bet", 101)).toThrow(InsufficientCreditsError);
  });

  it("allows spending exactly the full balance", () => {
    const start = { balance: 100, transactions: [] };
    const next = debit(start, "bet", 100);
    expect(next.balance).toBe(0);
  });
});

describe("refund and reset", () => {
  it("refunds a full amount as a credit of type refund", () => {
    const start = { balance: 0, transactions: [] };
    const next = refund(start, 250);
    expect(next.balance).toBe(250);
    expect(next.transactions[0]?.type).toBe("refund");
  });

  it("resets to an arbitrary balance and records the delta", () => {
    const start = { balance: 900, transactions: [] };
    const next = resetBalance(start, 300);
    expect(next.balance).toBe(300);
    expect(next.transactions[0]?.change).toBe(-600);
  });
});

describe("ledger integrity", () => {
  it("caps the ledger at LEDGER_CAP entries, keeping the newest", () => {
    let state = emptyState();
    for (let i = 0; i < LEDGER_CAP + 50; i += 1) {
      state = credit(state, "adjustment", 1, { now: i });
    }
    expect(state.transactions).toHaveLength(LEDGER_CAP);
    expect(state.transactions[0]?.timestamp).toBe(LEDGER_CAP + 49);
  });

  it("validates ledger shapes", () => {
    expect(validateLedgerState(emptyState())).toBe(true);
    expect(validateLedgerState(credit(emptyState(), "win", 10))).toBe(true);
    expect(validateLedgerState({ balance: -5, transactions: [] })).toBe(false);
    expect(validateLedgerState({ balance: 1.5, transactions: [] })).toBe(false);
    expect(validateLedgerState(null)).toBe(false);
  });
});