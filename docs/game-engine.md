# Game Engine

## Principles

1. **The engine is authoritative.** A round's result is produced by the
   engine; the UI only renders and animates what the engine reports.
2. **Game logic, randomness, and rendering are separate.** A game neither
   decides outcomes because an animation played, nor derives probabilities
   from visuals.
3. **Reusable round infrastructure** so each game implements rules, not
   plumbing.

## Contracts

Defined in `core/game-engine/types.ts`.

```ts
interface GameEngine<S extends object, R extends object> {
  readonly gameId: GameId;
  readonly version: string;
  beginRound(ctx: GameRoundContext, options?: unknown): S;  // authoritative initial state
  finishRound(ctx: GameRoundContext, state: S): R;          // authoritative result
  cancelRound?(ctx: GameRoundContext, state: S): void;
}
```

`options` carries whatever a game needs to commit before a round begins; for
Coin Flip that is `{ wager, picked }`, and for Roulette, `{ bets }`. Each game
documents its own options.

A `GameRoundContext` identifies one play session:

```ts
interface GameRoundContext {
  gameId: GameId;
  roundId: string;   // generated per session, used by economy records
  startedAt: number;
}
```

## Game catalogue

`core/game-engine/registry.ts` defines `GAME_REGISTRY`: all ten planned
games. Every entry is currently `availability: "conceptual"` and will flip to
`"implemented"` **only when its milestone is completed**:

| Game        | Milestone |
| ----------- | --------- |
| Coin Flip   | 2         |
| Roulette    | 3         |
| Blackjack   | 4         |
| Slots       | 5         |
| Dice        | 6         |
| Crash       | 7         |
| Mines       | 8         |
| Plinko      | 9         |
| Wheel       | 10        |
| Hi-Lo       | 10        |

Helpers: `getGameDefinition()`, `implementedGames()`, `isGameIdImplemented()`.

## Round lifecycle

The common conceptual flow every future game follows:

```
Game Definition → Game State → Game Engine → Round Lifecycle
      → Economy Transaction → History → Statistics → Presentation
```

Per milestone requirements, each game must additionally handle: invalid bet,
insufficient credits, rapid repeated input, double submission, navigation
mid-round, app restart, interrupted animation, unexpected state, corrupted
persisted data, extreme/zero/negative values, duplicate transactions, and
state desynchronisation.

## Randomness hook-in

Engines receive an `Rng` (see `core/randomness`). Production rounds use
crypto-backed randomness; seeded runs are supported for deterministic
development and simulation tests. Probability configuration should live
separately from presentation logic (per milestone).

## Implemented games

### Coin Flip (Milestone 2)

`games/coin-flip/` holds the first real engine:

```ts
const engine = createCoinFlipEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500, picked: "heads" });
const result = engine.finishRound(ctx, state);
// result.side   "heads" | "tails"
// result.outcome "win" | "loss"
// result.payout  wager * 2 on a win, 0 on a loss (even money)
```

Rules live in the engine, never the UI. A flip uses `rng.next() < 0.5` for
heads. Wagers must be whole credits within `[MIN_BET, MAX_BET]`
(`core/game-engine/config.ts`); anything else throws an `AppError` that the
screen surfaces as a refunded, non-event round. The result is resolved the
moment the player presses Flip; the 3D coin animation is presentation only, so
navigation mid-round cannot desynchronise state. Seeded `createRng({ seed })`
gives deterministic development runs.

### Roulette (Milestone 3)

`games/roulette/` holds the second real engine:

```ts
const engine = createRouletteEngine(createRng());
const state = engine.beginRound(ctx, {
  bets: [
    { id: newId(), kind: "straight", target: 7, wager: 500 },
    { id: newId(), kind: "red", target: null, wager: 200 },
  ],
});
const result = engine.finishRound(ctx, state);
// result.number    0..36 landed number
// result.color     "red" | "black" | "green"
// result.totalPayout  sum of every matching bet's multiplier
```

Rules live in the engine, never the UI. The ball is chosen with
`randomInt(0, 36, rng)` on a standard European wheel. Bets are validated per
chip: whole wagers within `[MIN_BET, MAX_BET]`, known kinds, straight targets
within `0..36`, dozen/column targets `1..3`, at least one bet, and no more
than `MAX_ROUND_BETS` (200). Payoffs: straight 36x, dozen and column 3x, all
outside bets even money. The outcome is resolved at spin press; the wheel and
ball animation is presentation only, so navigation mid-round cannot
desynchronise state. Seeded `createRng({ seed })` gives deterministic runs.

### Blackjack (Milestone 4)

`games/blackjack/` holds the first multi-action engine. Unlike the previous
games it exposes **interactive actions** that mutate round state, plus the
standard begin/finish lifecycle:

```ts
const engine = createBlackjackEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500 });   // 2 dealer + 2 player cards
let next = engine.hit(ctx, state);                       // draw for the active hand
next = engine.stand(ctx, next);                          // end the active hand
next = engine.double(ctx, next);                         // +bet, exactly one card
next = engine.split(ctx, next);                          // matching pair, once
const result = engine.finishRound(ctx, next);            // dealer to S17, settle
// result.outcome   "win" | "loss" | "push"
// result.winPayout credits to award (even money, or 3:2 for naturals)
// result.pushRefund credits to refund (pushed hands)
// result.hands     final per-hand state for the screen
```

Rules live in the engine, never the UI. The shoe is six shuffled 52-card
decks (`shuffle(this.buildShoe(), rng)`); cards are drained from the end of
the remaining shoe and the shoe auto-refills if a round exhausts it. Wagers
must be whole credits within `[MIN_BET, MAX_BET]`. Actions are validated per
call: a finished hand cannot hit or stand, double requires exactly two cards,
split requires an unmatched pair exactly once. A hand auto-completes on
bust or 21; the dealer draws while below a hard-or-soft 17 (S17). Settlement:
wins pay even money, naturals pay 3:2 (never for split hands), ties refund,
doubled hands settle at twice their wager. The screen debits the base wager,
debits again per double/split, awards `winPayout`, and refunds `pushRefund` /
an early quit through the economy store. Seeded `createRng({ seed })` gives
deterministic runs.

### Slots (Milestone 5)

`games/slots/` holds the first weighted-random engine. The round is a single
spin; `beginRound` validates the wager and `finishRound` resolves the whole
grid:

```ts
const engine = createSlotsEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500 });
const result = engine.finishRound(ctx, state);
// result.columns  5 reels x 3 rows (top to bottom) of SlotSymbol
// result.lines    0 or 1 winning line (symbol, columns, multiplier)
// result.payout   wager * multiplier on a win, 0 on a loss
```

Rules live in the engine, never the UI. Fifteen weighted symbol picks build a
five-by-three grid; each symbol's weight comes from `REEL_WEIGHTS` (cherry
common, seven rare). Only the middle row is scored: the engine takes the
longest left-to-right run of equal symbols, and pays `wager x multiplier`
from `PAYTABLE` when the run reaches five, four, or three (per-symbol 3x to
25x), or 1x for exactly two cherries. Runs starting in any other row do not
score. Payout is decided at spin press; the CSS reel-drop animation staggers
each reel to its landed column and rings winning cells at reveal, so
navigation mid-round cannot desynchronise state. The screen debits the wager
at spin and credits one payout at reveal through the economy store. Seeded
`createRng({ seed })` gives deterministic runs.

### Dice (Milestone 6)

`games/dice/` holds a two-die engine. One call per round: under seven
(2-6), over seven (8-12), or an exact total 2..12:

```ts
const engine = createDiceEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500, prediction: { total: 7 } });
const result = engine.finishRound(ctx, state);
// result.die1, result.die2  the rolled faces
// result.total             die1 + die2
// result.multiplier        even money, or exactMultiplier(total) on an exact call
// result.payout            wager * multiplier on a win, 0 on a loss
```

Rules live in the engine, never the UI. `finishRound` rolls two fair die
through the Rng and settles the call; under/over win on totals 2-6 / 8-12 at
even money (a 7 loses both), and an exact call wins only on its own total at
`floor((36 x 0.9) / ways)` (32x for totals with one way, 5x for a 7). The
result is decided at roll press; the screen tumbles two 3D CSS die that land
on the authoritative faces and reports `die1 + die2 = total`. The screen
debits the wager at roll and credits one payout at reveal through the economy
store. Seeded `createRng({ seed })` gives deterministic runs.

### Crash (Milestone 7)

`games/crash/` holds a time-running engine. The multiplier climbs from 1.00x
until a hidden crash point decided at round start; cash out any time the live
multiplier is still below it:

```ts
const engine = createCrashEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500 }); // crashPoint is drawn here
engine.cashOut(state, 1.98);
// result.outcome    "win" when 1.98 < crashPoint, otherwise "crash"
// result.multiplier the 2-decimal multiplier the round settled at
// result.payout     floor(wager x multiplier) on a win, 0 on a crash
```

Rules live in the engine, never the UI. `beginRound` draws `crashPoint`
straight from the Rng (so the outcome can never be decided by the animation),
`cashOut` honours a multiplier strictly below the point and settles anything
at or past it as a crash, and `finishRound` always settles a crash. The 1%
`HOUSE_EDGE` is baked into every draw, so roughly one ride in a hundred
crashes at 1.00x with no cash-out possible. The screen animates the shared
`multiplierAt(elapsedMs)` curve, debits the wager at start, and credits each
cash-out through the economy store. Seeded `createRng({ seed })` gives
deterministic runs.

### Mines (Milestone 8)

`games/mines/` holds a board-probability engine. A fixed 5 x 5 field hides a
configurable bomb count; reveal safe tiles to raise the multiplier, and cash
out at any time:

```ts
const engine = createMinesEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500, mines: 5 }); // bombs scattered here
const reveal = engine.reveal(state, 3); // safe tile extends the round
engine.cashOut(reveal.state);           // banks floor(wager x multiplier)
// result.revealed    the safe tiles found before banking
// result.bombCells   the hidden bomb layout
// result.payout      floor(wager x multiplier) on a win, 0 on a mine
```

Rules live in the engine, never the UI. `beginRound` scatters `mines` bombs
across the board with a seeded `shuffle` (25 tiles, 1..24 bombs);
`reveal(state, cell)` dedupes and bounds-checks, extends the round on a safe
tile, and settles it as a mine hit (zero payout) on a bomb. `cashOut` banks
`floor(wager x multiplier)` any time at least one safe tile is open, where
`multiplierFor` is the inverse chance all picks so far were safe, edged down
1% and floored to two decimals (1.23x for the first tile on five bombs, up to
24.75x for clearing the board on one bomb). The screen flips mined gems, turns
bombs red with a stagger on impact, debits the wager at start, and credits
each cash-out through the economy store. Seeded `createRng({ seed })` gives
deterministic runs.

### Plinko (Milestone 9)

`games/plinko/` holds a peg-field engine. A ball drops from the crown of a
board and bounces left or right at every peg; `beginRound` resolves the
bounces and the landing slot in one step:

```ts
const engine = createPlinkoEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500, rows: 12 }); // path & slot resolved here
const result = engine.finishRound(ctx, state);
// result.path      one left/right bounce per peg row (true = right)
// result.slot      the landing slot 0..rows
// result.multiplier the ladders[slot] payout for that board
// result.payout    floor(wager x multiplier)
```

Rules live in the engine, never the UI. `beginRound` validates whole wagers
in 100..100,000 and a board size in 8..16, then bounces the ball with a
seeded fair-coin `dropPath`; `finishRound` settles the slot against
`multiplierFor`. Because the outcome is resolved at drop time, the landing
animation is presentation only. `multiplierFor` normalizes a symmetric shape
so the probability-weighted return matches the target edge: the frequent
centre pays a modest jackpot (3.02x..3.51x across the presets), the just-off
centre slots skim, and rare outer echoes pay up to 40.18x, all below the
ledger-safe 1000x cap shared with Crash. The screen animates the bounce one
step per peg row, lights the landed slot, debits the wager at drop, and
credits the slot payout immediately. Seeded `createRng({ seed })` gives
deterministic drops.

### Wheel (Milestone 10)

`games/wheel/` holds a weighted-wheel engine. `beginRound` validates the
wager and draws the stop wedge by arc weight in one step:

```ts
const engine = createWheelEngine(createRng());
const state = engine.beginRound(ctx, { wager: 500 }); // stop wedge resolved here
const result = engine.finishRound(ctx, state);
// result.segment   the wedge index 0..3 the wheel stops on
// result.multiplier the wedge payout multiplier
// result.payout    floor(wager x multiplier)
```

Rules live in the engine, never the UI. `beginRound` validates whole wagers
in 100..100,000, then draws a wedge from a seeded uniform draw against the
arc weights; `finishRound` settles the wedge. Because the stop is resolved at
spin time, the animation is presentation only. The four wedge arcs span 100
units - zero 63%, 1x 29%, 5x 6%, 20x 2% - so the probability-weighted return
is exactly 0.99 (a 1% house edge) with clean numbers. `spinRotation` returns
the rotation that puts a wedge's centre under the top pointer, so the screen
only animates towards an engine-decided landing. The screen paints a
conic-gradient wheel, spins it to land the engine's wedge under the pointer,
debits the wager at spin, and credits the payout immediately. Seeded
`createRng({ seed })` gives deterministic spins.

### Hi-Lo (Milestone 10)

`games/hi-lo/` holds a card-guessing engine. `beginRound` deals a face-up top
card and a hidden second card from one shuffled deck; the player calls the
next card via `call`, and `finishRound` settles it:

```ts
const engine = createHiLoEngine(createRng());
let state = engine.beginRound(ctx, { wager: 500 }); // top card dealt, second hidden
state = engine.call(state, "higher");               // commit the guess
const result = engine.finishRound(ctx, state);
// result.topCard / result.revealCard  the two dealt cards
// result.outcome                      "win" | "loss"
// result.multiplier                   the true-odds payout, or 0 on a miss
// result.payout                       floor(wager x multiplier)
```

Rules live in the engine, never the UI. `beginRound` validates whole wagers
in 100..100,000 and deals without replacement; `call` accepts exactly one of
`higher`, `lower`, or `equal`; `finishRound` compares rank magnitudes (Ace
high). The multiplier is the genuine remaining-deck odds over the 51 cards
after the top card, skimmed by the 1% edge and floored to the last cent:
1.05x at the extremes and near 17x for an equal rank. A direction with no
cards left (higher over an Ace, lower under a Two) is unwinnable. The screen
flips the hidden card to the engine's reveal, debits the wager at deal, and
credits the payout the moment the call settles. Seeded `createRng({ seed })`
gives deterministic deals.

## Current state

**Milestone 10 ships the ninth and tenth playable games**: Coin Flip,
Roulette, Blackjack, Slots, Dice, Crash, Mines, Plinko, Wheel, and Hi-Lo are
all `implemented` in the registry. The round lifecycle is proven end to end:
wager, engine, result, ledger credit/debit, history, stats, and error
handling for synchronous (Coin Flip), multi-bet (Roulette), interactive
multi-action (Blackjack), weighted-random (Slots), deterministic-roll (Dice),
time-running cash-out (Crash), sequential-pick cash-out (Mines), single-shot
ball-drop (Plinko), weighted-spin (Wheel), and card-guess (Hi-Lo) rounds.