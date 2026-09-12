import type { GameId } from "@/core/game-engine/types";

export type TransactionType =
  | "initial-allocation"
  | "daily-bonus"
  | "bet"
  | "win"
  | "refund"
  | "reset"
  | "adjustment"
  | "debug";

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  "initial-allocation",
  "daily-bonus",
  "bet",
  "win",
  "refund",
  "reset",
  "adjustment",
  "debug",
];

export interface TransactionMeta {
  gameId?: GameId;
  roundId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface EconomyTransaction extends TransactionMeta {
  id: string;
  type: TransactionType;
  timestamp: number;
  previousBalance: number;
  change: number;
  newBalance: number;
}

export interface EconomyLedgerState {
  balance: number;
  transactions: EconomyTransaction[];
}

export const INITIAL_ALLOCATION = 25_000;
export const MIN_BALANCE = 0;
export const MAX_BALANCE = 1_000_000_000;
export const LEDGER_CAP = 500;

export function isTransactionType(value: unknown): value is TransactionType {
  return (
    typeof value === "string" &&
    (TRANSACTION_TYPES as readonly string[]).includes(value)
  );
}

export function isEconomyTransaction(value: unknown): value is EconomyTransaction {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Partial<EconomyTransaction>;
  return (
    typeof t.id === "string" &&
    isTransactionType(t.type) &&
    typeof t.timestamp === "number" &&
    typeof t.previousBalance === "number" &&
    typeof t.change === "number" &&
    typeof t.newBalance === "number"
  );
}