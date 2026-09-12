import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createVersionedStateStorage,
  PERSISTENCE_KEYS,
} from "@/core/persistence";
import {
  allocateInitialBalance,
  credit,
  debit,
  refund,
  resetBalance,
  validateLedgerState,
  type EconomyLedgerState,
  type EconomyTransaction,
  type TransactionMeta,
  type TransactionType,
} from "@/core/economy";

export interface EconomyStore extends EconomyLedgerState {
  hydrated: boolean;
  ensureInitialAllocation: () => void;
  bet: (amount: number, meta?: TransactionMeta) => EconomyTransaction;
  award: (amount: number, meta?: TransactionMeta) => EconomyTransaction;
  returnCredits: (amount: number, meta?: TransactionMeta) => EconomyTransaction;
  adjust: (type: TransactionType, amount: number, meta?: TransactionMeta) => EconomyTransaction;
  resetBalanceTo: (amount: number, note?: string) => void;
}

const INITIAL_LEDGER: EconomyLedgerState = {
  balance: 0,
  transactions: [],
};

type PersistedEconomy = Pick<EconomyStore, "balance" | "transactions">;

export const useEconomyStore = create<EconomyStore>()(
  persist<EconomyStore, [], [], PersistedEconomy>(
    (set, get) => ({
      ...INITIAL_LEDGER,
      hydrated: false,
      ensureInitialAllocation: () => {
        const { balance, transactions } = get();
        const current: EconomyLedgerState = { balance, transactions };
        const next = allocateInitialBalance(current);
        if (next.balance !== current.balance || next.transactions !== current.transactions) {
          set(next);
        }
      },
      bet: (amount, meta) => {
        const current = ledgerOf(get());
        const next = debit(current, "bet", amount, meta);
        set(next);
        return firstTransaction(next);
      },
      award: (amount, meta) => {
        const current = ledgerOf(get());
        const next = credit(current, "win", amount, meta);
        set(next);
        return firstTransaction(next);
      },
      returnCredits: (amount, meta) => {
        const current = ledgerOf(get());
        const next = refund(current, amount, meta);
        set(next);
        return firstTransaction(next);
      },
      adjust: (type, amount, meta) => {
        const current = ledgerOf(get());
        const next = amount >= 0
          ? credit(current, type, amount, meta)
          : debit(current, type, Math.abs(amount), meta);
        set(next);
        return firstTransaction(next);
      },
      resetBalanceTo: (amount, note) => {
        const current = ledgerOf(get());
        set(resetBalance(current, amount, note ? { note } : {}));
      },
    }),
    {
      name: PERSISTENCE_KEYS.economy.key,
      storage: createJSONStorage<PersistedEconomy>(() =>
        createVersionedStateStorage(PERSISTENCE_KEYS.economy.version),
      ),
      partialize: (state) => ({
        balance: state.balance,
        transactions: state.transactions,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<EconomyLedgerState> | undefined;
        const valid = p !== undefined && validateLedgerState(p);
        return {
          ...current,
          balance: valid ? (p as EconomyLedgerState).balance : current.balance,
          transactions: valid
            ? (p as EconomyLedgerState).transactions
            : current.transactions,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

function ledgerOf(store: EconomyStore): EconomyLedgerState {
  return {
    balance: store.balance,
    transactions: store.transactions,
  };
}

function firstTransaction(next: EconomyLedgerState): EconomyTransaction {
  const txn = next.transactions[0];
  if (!txn) {
    throw new Error("Economy: transaction was not recorded.");
  }
  return txn;
}