# Testing

## Setup

- **Vitest** with jsdom + React Testing Library.
- Config: `vitest.config.ts` (React plugin, `@` alias, setup file).
- Setup: `tests/setup.ts` loads `@testing-library/jest-dom/vitest` and stubs
  `matchMedia` plus `next/navigation` / `next/link` for shell and page tests.
- Run everything with `pnpm check` (typecheck + lint + test) or `pnpm test`.

## What is tested

| Suite                        | Scope                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `tests/economy.test.ts`      | Allocation, credit/debit invariants, insufficient funds, overflow, ledger capping, state validation. |
| `tests/randomness.test.ts`   | Seeded determinism (numeric & string), crypto range, `randomInt`/`pick`/`chance`/`shuffle`. |
| `tests/persistence.test.ts`  | Memory adapter, versioned envelopes (corruption, version mismatch), zustand-compatible state storage. |
| `tests/themes.test.ts`       | Complete palettes, system resolution, CSS variable generation, contrast checks. |
| `tests/ledger.test.ts`       | Ledger labels, relative timestamps, totals, day grouping.          |
| `tests/stats.test.ts`        | Per-game aggregation (rounds/wagers/payouts/net/return rate/largest win), highlights (largest win/loss, best return, best/worst game, biggest round, win rate), balance-series downsampling, empty-ledger behaviour. |
| `tests/audio.test.ts`        | Noop fallback, silent fallback without `AudioContext`, enable gating, tone scheduling, destination wiring, master-gain volume. |
| `tests/foundation.test.tsx`  | Foundation screen renders, every theme choice present.             |
| `tests/shell.test.tsx`       | AppShell offers the five primary destinations, `aria-current` on the active tab only, visible-on-focus skip link targeting `#main`, distinct nav landmarks. |
| `tests/primary-action-key.test.tsx` | Space/Enter fire the primary action from the body; modified/non-target keys pass through; buttons and inputs keep native behaviour; disabled branch stays silent. |
| `tests/games-grid.test.tsx`  | Games library lists the whole registry and milestone pills.        |
| `tests/wallet-activity.test.tsx` | Wallet/Activity render ledger rows, day headings, and empty states. |
| `tests/coin-flip-engine.test.ts` | Coin Flip engine: wager/side validation, even-money payout, win/loss mapping, seeded determinism. |
| `tests/coin-flip-screen.test.tsx` | Coin Flip screen: enabled-state gating, win/loss UI, ledger integration, over-balance guard, new round, 3D flip markup. |
| `tests/roulette-engine.test.ts`  | Roulette board rules (colors, dozens, columns, matches) plus engine validation, per-bet payouts, zero handling, determinism. |
| `tests/roulette-screen.test.tsx` | Roulette screen: disabled-until-chip, undo/clear, wheel reveal with win/loss ledger impact, round history, new round. |
| `tests/blackjack-engine.test.ts` | Blackjack cards (totals, busts, naturals) plus engine: wager validation, hit/stand/double/split rules, stake math, auto-complete on 21/bust, dealer S17 play, settlement (even money, 3:2, push refunds, doubled hands, split independence, naturals vs naturals), determinism. |
| `tests/slots-engine.test.ts`              | Slots: symbol domain, wager validation range, weighted geometry (five x three grid), payline scoring (five/four/three of a kind per symbol, two-cherry even money, non-paying two-of-a-kind, payline-only scoring), payout math, seeded determinism. |
| `tests/dice-engine.test.ts`               | Dice: prediction domain, exact-total multipliers per ways, wager validation range, fair two-die rolls, under/over settlement (a 7 loses both), exact-call wins and misses, payout math, seeded determinism. |
| `tests/crash-engine.test.ts`              | Crash: curve shape, multiplier rounding, wager validation range, house edge baked into the smallest point, two-decimal crash points, Rng-drawn points up to the cap, cash-out honouring (strictly below the point), payload flooring, crash settlement, seeded determinism. |
| `tests/mines-engine.test.ts`              | Mines: multiplier ladder math at the two-decimal floor, wager/bomb-count validation range, bomb layout size and forced uniqueness, reveal safe/mine handling with dedupe and bounds checks, finished-round refusal, board-cleared flagging, cash-out landing at the expected multiple, payout flooring, ledger-safe win/mine results, seeded determinism. |
| `tests/plinko-engine.test.ts`             | Plinko: binomial coefficients, slot probability mass, the EV-normalized ladder (known centre/outer values, symmetry, target edge across every board, ledger-safe cap), wager/rows validation range, path length and slot consistency per board, settlement at the ladder multiplier with payout flooring, idempotent finish, seeded determinism. |
| `tests/wheel-engine.test.ts`              | Wheel: fixed wedge table, total weight, exact 0.99 expected return, arc-share probabilities, multi-segment table, missing/non-whole/out-of-range wager validation, stop-within-range for repeated spins, zero-wedge frequency vs jackpot rarity, settlement per wedge with payout flooring, zero-stop settlement, idempotent finish, engine/manual round parity, seeded determinism, and spin math that lands every wedge's centre under the pointer. |
| `tests/hi-lo-engine.test.ts`              | Hi-Lo: rank magnitudes Ace high, above/below/equal card counts summing to 51, true-odds multipliers skimmed by the house edge with a flooring epsilon, unwinnable edge directions, known jackpot/edge values, wager validation range, two-card deal without replacement, prediction validation and single-call enforcement, settle-before-call refusal, win/loss settlement with payout flooring, edge-direction losses, idempotent finish, engine/manual round parity, rank-magnitude matching, seeded determinism. |

## Conventions

- **Game logic is tested as pure modules** (no React) wherever possible:
  deterministic, fast, and precise about edge cases.
- **Regression policy:** never break a previously completed milestone. New
  milestones must leave prior suites green.
- Each milestone adds tests for its own logic, per-game edge cases, and
  economy/transaction behaviour.

## Manual verification gate

Automated suites are necessary but not sufficient. Every milestone ends with a
hand-run checklist recorded in `docs/development-tracker.md` (launch, create a
round, verify balance + transaction history + persistence + restart
behaviour, etc.). See the spec (`idea.txt`, §23) for the report format.