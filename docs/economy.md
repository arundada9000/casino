# Economy

## Model

Every balance-changing action produces an **audited transaction**. Components
never mutate the wallet directly; all writes flow through
`core/economy` (`ledger.ts`), and the UI reads state from
`stores/economy.ts`.

### Transaction record

```ts
interface EconomyTransaction {
  id: string;                    // unique id
  type: TransactionType;
  timestamp: number;             // epoch ms
  gameId?: GameId;               // when game-related
  roundId?: string;              // links to an engine round
  previousBalance: number;
  change: number;                // signed
  newBalance: number;
  note?: string;
  metadata?: Record<string, unknown>;
}
```

### Transaction types

`initial-allocation` · `daily-bonus` · `bet` · `win` · `refund` · `reset` ·
`adjustment` · `debug`

## Rules

- Credits are **whole, non-negative, finite integers**.
- `debit` (bet) never lets the balance fall below `0` →
  `InsufficientCreditsError`.
- `credit` guards against exceeding `MAX_BALANCE` (1,000,000,000).
- The ledger is capped at `LEDGER_CAP` (500) entries, keeping the newest.
- `allocateInitialBalance` runs once per ledger (guarded by a transaction of
  type `initial-allocation`); the welcome amount is `INITIAL_ALLOCATION`
  (25,000).
- Every function in `ledger.ts` is **pure and unit-testable**; the Zustand
  store in `stores/economy.ts` is a thin persistence-bound wrapper exposing
  `bet`, `award`, `returnCredits`, `adjust`, `resetBalanceTo`,
  `ensureInitialAllocation`.

## Placement flow per round

Games follow the same shape (from Milestone 2 onward):

1. Begin round → generate `roundId`.
2. `bet(amount, { gameId, roundId })`: debits immediately.
3. Resolve round in the engine.
4. On win: `award(amount, { gameId, roundId })`; on refund: `returnCredits`.
5. History and statistics derive from the ledger.

## Integrity

- Validation lives in the rule module, so UI bugs cannot corrupt balances.
- Persisted economy data is versioned (`aurelia.economy` → `{ v, data }`) and
  validated on rehydrate; invalid records fall back to a safe state.
- Duplicate submissions are prevented at the store/engine layer per game
  milestone.

## Current state

Milestone 0 provides the economy rules and a working welcome allocation. No
game issues economy transactions yet.