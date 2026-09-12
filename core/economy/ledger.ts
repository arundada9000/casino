import type { EconomyLedgerState, TransactionMeta } from "./types";
import {
  INITIAL_ALLOCATION,
  MAX_BALANCE,
  LEDGER_CAP,
  MIN_BALANCE,
  type EconomyTransaction,
  type TransactionType,
} from "./types";
import {
  assertValidCreditAmount,
  EconomyError,
  EconomyErrorCodes,
  InsufficientCreditsError,
} from "./errors";
import { newId } from "@/lib/id";

interface ChangeOptions extends TransactionMeta {
  now?: number;
}

function appendLedger(
  state: EconomyLedgerState,
  transaction: EconomyTransaction,
): EconomyLedgerState {
  const transactions = [transaction, ...state.transactions];
  return {
    balance: transaction.newBalance,
    transactions: transactions.slice(0, LEDGER_CAP),
  };
}

/**
 * Allocates the starting balance. Guarded so it can only ever run once per
 * ledger: re-allocation is intentionally ignored.
 */
export function allocateInitialBalance(
  state: EconomyLedgerState,
  amount = INITIAL_ALLOCATION,
  options: ChangeOptions = {},
): EconomyLedgerState {
  if (state.balance > 0 || state.transactions.some((t) => t.type === "initial-allocation")) {
    return state;
  }
  assertValidCreditAmount(amount, { code: "allocateInitialBalance" });
  return credit(state, "initial-allocation", amount, { note: "Welcome allocation", ...options });
}

export function credit(
  state: EconomyLedgerState,
  type: TransactionType,
  amount: number,
  options: ChangeOptions = {},
): EconomyLedgerState {
  assertValidCreditAmount(amount, { code: "credit" });
  const previousBalance = state.balance;
  const newBalance = previousBalance + amount;
  if (newBalance > MAX_BALANCE) {
    throw new EconomyError(
      EconomyErrorCodes.OVERFLOW,
      `Credit would exceed the maximum balance (${MAX_BALANCE}).`,
      { previousBalance, amount, newBalance },
    );
  }
  const transaction: EconomyTransaction = {
    id: newId(),
    type,
    timestamp: options.now ?? Date.now(),
    previousBalance,
    change: amount,
    newBalance,
    ...(options.gameId ? { gameId: options.gameId } : {}),
    ...(options.roundId ? { roundId: options.roundId } : {}),
    ...(options.note ? { note: options.note } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  };
  return appendLedger(state, transaction);
}

/**
 * Debits credits for a wager or adjustment. Never allows the balance to fall
 * below zero.
 */
export function debit(
  state: EconomyLedgerState,
  type: TransactionType,
  amount: number,
  options: ChangeOptions = {},
): EconomyLedgerState {
  assertValidCreditAmount(amount, { code: "debit" });
  const previousBalance = state.balance;
  const newBalance = previousBalance - amount;
  if (newBalance < MIN_BALANCE) {
    throw new InsufficientCreditsError(previousBalance, amount, {
      code: "debit",
      type,
    });
  }
  const transaction: EconomyTransaction = {
    id: newId(),
    type,
    timestamp: options.now ?? Date.now(),
    previousBalance,
    change: -amount,
    newBalance,
    ...(options.gameId ? { gameId: options.gameId } : {}),
    ...(options.roundId ? { roundId: options.roundId } : {}),
    ...(options.note ? { note: options.note } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  };
  return appendLedger(state, transaction);
}

export function refund(
  state: EconomyLedgerState,
  amount: number,
  options: ChangeOptions = {},
): EconomyLedgerState {
  return credit(state, "refund", amount, { note: "Round refunded", ...options });
}

export function resetBalance(
  state: EconomyLedgerState,
  toAmount: number,
  options: ChangeOptions = {},
): EconomyLedgerState {
  assertValidCreditAmount(toAmount, { code: "resetBalance" });
  if (toAmount > MAX_BALANCE) {
    throw new EconomyError(EconomyErrorCodes.OVERFLOW, `Reset target exceeds maximum balance.`, {
      toAmount,
    });
  }
  const previousBalance = state.balance;
  const change = toAmount - previousBalance;
  const timestamp = options.now ?? Date.now();
  const transaction: EconomyTransaction = {
    id: newId(),
    type: "reset",
    timestamp,
    previousBalance,
    change,
    newBalance: toAmount,
    ...(options.note ? { note: options.note } : {}),
  };
  return { ...appendLedger(state, transaction), balance: toAmount };
}

export function validateLedgerState(value: unknown): value is EconomyLedgerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<EconomyLedgerState>;
  return (
    typeof v.balance === "number" &&
    Number.isFinite(v.balance) &&
    v.balance >= MIN_BALANCE &&
    Number.isInteger(v.balance) &&
    Array.isArray(v.transactions)
  );
}