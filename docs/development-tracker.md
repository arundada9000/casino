# Development Tracker

**Current Milestone:** 12 (Final Product Polish): polish pass complete, awaiting manual verification.

## Milestone status

| Milestone | Title                    | Status      |
| --------- | ------------------------ | ----------- |
| 0         | Project Foundation       | Complete    |
| 1         | Core App Shell           | Complete    |
| 2         | First Game: Coin Flip    | Complete    |
| 3         | Roulette                 | Complete    |
| 4         | Blackjack                | Complete    |
| 5         | Slots                    | Complete    |
| 6         | Dice                     | Complete    |
| 7         | Crash                    | Complete    |
| 8         | Mines                    | Complete    |
| 9         | Plinko                  | Complete    |
| 10a       | Wheel                    | Complete    |
| 10b       | Hi-Lo                    | Complete    |
| 11        | Insights & Polish        | Complete    |
| 12        | Final Product Polish     | Complete    |

## Completed milestones

- **Milestone 0: Project Foundation.** Builds the architecture, design
  system, economy, persistence, randomness, and tooling. No game code.
- **Milestone 1: Core App Shell.** Automated gates green (typecheck, lint,
  56 unit/component tests, production build, production smoke test returned
  HTTP 200). Manual on-device verification below remains for the reviewing
  developer.
- **Milestone 2: First Game: Coin Flip.** The first complete game lifecycle:
  wager, heads/tails call, flip animation, authoritative engine result, credit
  transaction, ledger history entry, stats, new round, and error handling.
  72 tests green across 12 suites; production build and smoke test HTTP 200.
- **Milestone 3: Roulette.** European roulette with the full wheel: straight
  number 0..36, red/black, odd/even, low/high, dozens, and columns. Multi-bet
  stacking (up to 200 chips), undo last, clear all, spin animation with the
  authoritative engine deciding the outcome mid-spin (pure presentation),
  win/loss reveal, round history, and ledger integration.
  88 tests green across 14 suites; production build and smoke test HTTP 200.
- **Milestone 4: Blackjack.** Classic twenty-one against a dealing shoe: deal,
  hit, stand, double down (any two cards, even after a split), split a matching
  pair exactly once, dealer play to S17, and full settlement (even-money wins,
  3:2 naturals, refunds on pushes, doubled hands at twice the stake). Styled as
  a felt table with card faces on a dark green background, a hidden hole card
  that flips at reveal, per-hand totals, round history, and ledger integration
  for the base wager, split/double additions, payouts, and refunds.
  116 tests green across 15 suites; production build and smoke test HTTP 200.
- **Milestone 5: Slots.** A ceremonial five-reel slot machine with one
  left-to-right payline. Weighted reel strips decide a three-row grid at spin
  time (the engine is authoritative), a CSS reel-drop animation staggers the
  reels to a stop, and the middle row is scored for left-run matches: three or
  more of a kind pays a per-symbol multiplier (3x up to 25x for five sevens),
  two cherries pay even money, and everything else stays with the house. The
  reels land mid-window in a dark machine shell with a gold payline marker,
  winning cells are ringed at reveal, and the screen ships a house-frame with
  a payer-paytable, round history rail, and full ledger integration (single
  debit at spin, single credit at reveal).
  133 tests green across 16 suites; production build and smoke test HTTP 200.
- **Milestone 6: Dice.** Two fair dice settle a single call made before the
  roll: under seven (2-6), over seven (8-12), or an exact total (2..12, paid
  by how few ways it can roll). The engine rolls both die through the
  crypto-backed Rng and settles the call authoritatively; the screen tumbles
  two 3D CSS dice that land on the exact face values, then the total, the
  multiplier, and the credit result appear in a result card. The wager debits
  at roll and any payout credits at reveal.
  152 tests green across 17 suites; production build and smoke test HTTP 200.
- **Milestone 7: Crash.** The multiplier climbs from 1.00x until the bus
  crashes at a point the engine decided at round start (through the
  crypto-backed Rng, never the visuals). The player cashes out any time the
  live multiplier is still below that hidden point and banks
  `wager x multiplier` (2-decimal multiplier, payout floored to whole
  credits); if the bus passes the point first, the wager stays with the
  house. The screen animates the exponential climb with a glowing readout and
  a rising gauge, honors the placed bet, and credits each cash-out.
  169 tests green across 18 suites; production build and smoke test HTTP 200.
- **Milestone 8: Mines.** A fixed 5 x 5 field hides between 3 and 20 bombs
  (scattered by the crypto-backed Rng at round start); the player reveals
  safe tiles to grow a fair cash-out multiplier, banks it any time with a
  virtual cash-out, and loses the round on the first bomb. The engine owns
  the bomb layout, the reveal rules, tile deduplication, the multiplier
  ladder, and the win/loss settlement. The minefield flips-safe gems as you
  play, shudders red when a bomb goes off, and the ledger debits the wager at
  start and credits a cash-out at any reveal.
  191 tests green across 19 suites; production build and smoke test HTTP 200.
- **Milestone 9: Plinko.** A ball drops from the crown of a peg field and
  bounds left or right at every peg, decided at drop time by the
  crypto-backed Rng, and lands in one of the payout slots. The engine owns
  the path and the settlement; the field animates the bounce to the exact
  slot, then the slot lights up with the multiplier it pays. The ladder is
  honest: the multiplier table is normalized so the probability-weighted
  average of every slot returns the target edge, with the frequent centre
  payout and rare outer echoes shaped for drama. The board is configurable
  (8, 10, 12, or 16 peg rows), and the ledger debits the wager at drop and
  credits the slot payout immediately.
  215 tests green across 20 suites; production build and smoke test HTTP 200.
- **Milestone 10: Wheel.** The first half of Milestone 10 as a separate
  controlled addition. A weighted wheel of multipliers: four wedge arcs (zero
  63%, 1x 29%, 5x 6%, 20x 2%) spanning 100 units give a return of exactly
  0.99 with clean, honest numbers. The engine draws the stop wedge at spin
  time and settles it; the screen animates only towards that wedge, so the
  spin can never change the outcome, and the ledger debits at spin and
  credits the payout on landing.
  233 tests green across 21 suites; production build and smoke test HTTP 200.
- **Milestone 10: Hi-Lo.** The second half of Milestone 10, shipped as its own
  separate pass. One shuffled deck deals a face-up top card and a hidden
  second card; the player calls Higher, Lower, or Equal, and the true rank
  odds for the 51 remaining cards set the payout (fair odds skimmed by the 1%
  edge, floored to the last cent). The engine fixes both cards at deal time
  and resolves only on the call, so the flip is presentation. All ten games in
  the registry are now playable.
  254 tests green across 22 suites; production build and smoke test HTTP 200.

## Milestone 10 features (Hi-Lo)

On top of the Milestone 2 through 9 game lifecycles:

- **Hi-Lo engine** (`games/hi-lo/engine.ts`): a proper
  `GameEngine<HiLoState, HiLoResult>` implementation owning the rules.
  `beginRound` validates whole wagers in 100..100,000 and deals the top and
  reveal cards from a seeded shuffled deck; `call` commits one prediction and
  `finishRound` settles it. Both cards are fixed at deal time, so the flip
  animation can never influence the settlement.
- **True deck odds** (`games/hi-lo/config.ts`): `cardsAbove`/`cardsBelow`/
  `cardsEqual` count the 51 remaining cards after the top card, so a call pays
  the genuine odds skimmed by the 1% house edge and floored to the last cent
  (1.05x at the extremes up to a near-17x equal-rank jackpot). A direction with
  no cards left (higher over an Ace, lower under a Two) is unwinnable and
  cannot be called from the UI.
- **Hi-Lo screen** (`games/hi-lo/HiLoScreen.tsx`): a felt table with a face-up
  top card, a reversible hidden card, three call buttons showing each live
  multiplier and remaining-card count, a flip reveal, a win/loss result card,
  the shared wager stepper and presets, and a 12-round history of top-vs-reveal
  tiles with net stats.
- **Ledger integration**: the wager debits at deal and the payout credits the
  moment the call settles (even if the player leaves mid-flip), so Wallet,
  Activity, and Profile stats update and persist right away; refunds restore
  the wager if the engine rejects a round.
- **Rules chosen deliberately**: one deck per round (dealt without
  replacement), a single call per round, three honest outcomes, and odds
  computed from the real remaining deck rather than a fixed paytable.

## Milestone 11 features (Insights & Polish)

A read-only analytics layer over the existing ledger, plus product polish.
All ten games already run end to end, so this milestone derives insight from
what they already record.

- **Statistics library** (`lib/stats.ts`, `tests/stats.test.ts`):
  `computeActivityStats` walks the whole persisted ledger - every governed
  transaction already carries the originating `gameId` and `roundId` on
  `TransactionMeta`, so no secondary state is needed - and projects per-game
  stats (rounds, wagers, payouts, net, return rate, largest win), highlights
  (largest win/loss, biggest winning round, best return game, most rewarding
  game, needs-work game, win rate), and a downsampled balance-over-time series
  (a `maxSeriesPoints` window keeps the shape readable on long ledgers).
  Figures are projections of real gameplay only; simulation data never enters
  them.
- **Insight components** (`components/stats/`): `StatCard` / `StatGrid`
  tone-coded value cards; `BalanceChart`, a hand-rolled SVG area + line chart
  that draws in via `stroke-dashoffset` under a reduced-motion guard; and
  `GameGainChart`, zero-centred per-game bars in success/danger colours. No
  drawing dependencies.
- **Activity rework** (`app/(shell)/activity/page.tsx`): a Wagered / Won /
  Net / rounds / biggest-win / biggest-loss stat grid, a By-game gain chart, a
  Highlights list (Top return, Most rewarding, Needs work, Biggest winning
  round), and the day-grouped history kept below.
- **Wallet rework** (`app/(shell)/wallet/` + `wallet.module.css`): the Balance
  card now sits above a Balance-trend card rendering the SVG chart with the
  observed start → current range, plus a compact stat grid once any gameplay
  exists.
- **Sound & haptics controls** (`core/audio/*`, `lib/app-feedback.ts`,
  `stores/settings.ts`): `SoundEngine.setVolume` added with a noop fallback;
  the WebAudio engine synthesizes richer event tones (two-, three-, and
  four-note sequences) and its master gain honours the volume; Settings gains a
  0-100 volume slider and a "Test sound & haptics" preview button that
  rehearses select / bet / win / loss, with the toggles passing the current
  volume through to the engine.
- **Profile name** (`app/(shell)/profile/` + `profile.module.css`, Home): an
  editable display name (sanitized to 24 characters, persisted with settings)
  used by the Home greeting, falling back to "Guest".
- **Version 0.12.0**, build tag "Milestone 11 · Insights & Polish". 263 tests
  green across 23 suites; `pnpm typecheck`, `pnpm lint`, `pnpm build`, and an
  HTTP smoke of every route pass.

## Milestone 12 features (Final Polish)

A focused, no-gameplay-change polish pass across accessibility, keyboard
input, native-feel meta, and performance.

- **Chrome accessibility** (`components/shell/AppShell.tsx` + `shell.module.css`):
  a visible-on-focus "Skip to content" link targeting `#main`; `aria-current`
  of "page" on the active tab in both navs; distinct landmark labels
  ("Primary navigation" sidebar, "Primary navigation · tab bar") so screen
  readers no longer announce two identical landmarks.
- **Keyboard shortcuts** (`hooks/usePrimaryActionKey.ts`, wired into all ten
  game screens): Space/Enter from the page body triggers the current primary
  action - Flip, Spin, Roll, Deal, Drop, Start, mines Cash out, Crash Cash out
  mid-climb - and starts the next round when one is finished. The hook never
  intercepts keystrokes aimed at a button, link, or input, so focused native
  controls keep their built-in behaviour and double-firing is impossible.
- **Native-feel meta**: dynamic `theme-color` already tracks the active theme
  (verified). Header chrome now targets the correct design-token easing var
  (`--a-ease-standard`) in `components/stats/balance-chart.module.css`, which
  previously referenced a non-existent `--a-easing-standard` and silently used
  its fallback.
- **Performance**: day-grouping and recent-transaction views in Activity and
  Wallet are memoised so they stop re-computing on unrelated state churn; the
  fine-grained zustand selectors already scope re-renders to what each screen
  reads.
- **Empty-state coverage**: Activity, Wallet, and Home each ship a tailored
  EmptyState; Games always renders the registry and Profile always has
  content, so no fabricated states were added.
- **Tests**: `tests/shell.test.tsx` now asserts the skip link, the `#main`
  target id, `aria-current` on the active tab only, and the renamed landmarks;
  new `tests/primary-action-key.test.tsx` covers Space/Enter firing from the
  body, modified-key and non-target-key pass-through, silence over buttons and
  inputs, and the disabled branch.
- **Version 0.13.0**, build tag "Milestone 12 · Final Polish". 269 tests green
  across 24 suites; typecheck, lint, build, and HTTP smoke all pass.

## Milestone 9 features

On top of the Milestone 2 through 8 game lifecycles:

- **Plinko engine** (`games/plinko/engine.ts`): a proper
  `GameEngine<PlinkoState, PlinkoResult>` implementation owning the rules.
  `beginRound` validates whole wagers in 100..100,000 and a board size in
  8..16, then bounces the ball down the peg field with a seeded fair-coin
  `dropPath` and resolves the landing slot. `finishRound` settles the slot
  against `multiplierFor` and floors the payout to the last credit; because
  the outcome is resolved at drop time, the animation can never influence the
  settlement.
- **Honest multiplier ladder** (`games/plinko/config.ts`): `multiplierFor`
  scales a symmetric payout shape so the probability-weighted return equals
  the target edge, floored to two decimals. The shape pays a centre jackpot
  (3.02x..3.51x on the preset boards), skims sub-credit payouts just off
  centre, and echoes rare outer jackpots (up to 40.18x on the 16-row board);
  every value sits under the ledger-safe 1000x cap shared with Crash.
  `slotProbability` is the binomial coin mass for a fair ball.
- **Plinko screen** (`games/plinko/PlinkoScreen.tsx`): a dark peg field with
  a gold ball that bounces to the authoritative slot in one step per peg row,
  a multiplier lane under every slot that lights on landing, a result card
  with the slot and multiplier, a board-size picker, the shared wager stepper
  and presets, and a 12-slot round history with net stats.
- **Ledger integration**: the wager debits at drop and the slot payout
  credits immediately through the existing economy store (even if the player
  leaves mid-animation), so Wallet, Activity, and Profile stats update and
  persist right away.
- **Rules chosen deliberately**: a single centred ball, configurable peg rows
  as the only difficulty dial, fair-coin bounces, no multi-ball drops, and an
  honest payout table instead of a house-subsidized jackpot.

## Milestone 10 features (Wheel)

On top of the Milestone 2 through 9 game lifecycles:

- **Wheel engine** (`games/wheel/engine.ts`): a proper
  `GameEngine<WheelState, WheelResult>` implementation owning the rules.
  `beginRound` validates whole wagers in 100..100,000 and draws the stop wedge
  by arc weight at spin time. `finishRound` settles the wedge against its
  multiplier and floors the payout to the last credit; because the stop is
  resolved at spin time, the animation can never influence the settlement
  (identical contract to Plinko).
- **Weighted wheel** (`games/wheel/config.ts`): four wedge types spanning 100
  arc units - zero 63%, 1x 29%, 5x 6%, 20x 2% - so the probability-weighted
  return is exactly 0.99 (a 1% house edge) with clean, honest numbers.
  `segmentProbability` is the wedge's share of the arc. Equal-size segments
  were rejected because they cannot reach a clean 0.99 edge.
- **Wheel screen** (`games/wheel/WheelScreen.tsx`): a conic-gradient wheel
  with a fixed pointer, a single spin that accelerates then decelerates to
  land the engine's wedge exactly under the pointer, an odds panel per
  segment, the shared wager stepper and presets, a result card, and a 12-round
  history with win/zero tiles and net stats.
- **Ledger integration**: the wager debits at spin and the wedge payout
  credits immediately through the existing economy store (even if the player
  leaves mid-spin), so Wallet, Activity, and Profile stats update and persist
  right away; refunds restore the wager if the engine rejects a round.
- **Rules chosen deliberately**: a single weighted spin per round, zero
  outcome as part of the arc, no bet splitting, and an honest 0.99 return made
  clean by arc weighting instead of equal-size segments.

## Milestone 8 features

On top of the Milestone 2 through 7 game lifecycles:

- **Mines engine** (`games/mines/engine.ts`): a proper
  `GameEngine<MinesState, MinesResult>` implementation owning the rules.
  `beginRound` validates whole wagers in 100..100,000 and a bomb count in
  1..24, then scatters `mines` bombs across the 5 x 5 board with a seeded
  `shuffle`. `reveal` flips one tile (dedupes, bounds-checks, refuses finished
  rounds), extends the round on a safe tile, and settles it as a mine hit on a
  bomb. `cashOut` banks floor(wager x multiplier) any time at least one safe
  tile is open; `finishRound` settles any stopped round.
- **Multiplier ladder** (`games/mines/config.ts`): `multiplierFor` is the
  inverse chance every pick so far was safe, edged down 1% and floored to two
  decimals. The board is fixed at 5 x 5 (`BOARD_TILES = 25`); difficulty is
  the bomb count (presets 3, 5, 8, 10, 12, 15, 20). Clearing every safe tile
  pays the top multiple (24.75x on one bomb).
- **Mines screen** (`games/mines/MinesScreen.tsx`): a dark minefield shell
  with a 5 x 5 tile grid, a live cash-out multiple and next-tile preview, a
  gem mark on revealed safe tiles, a shuddering red bomb on impact with
  staggered reveal, a prominent green Cash-out button once a safe tile exists,
  a bomb-count picker, the shared wager stepper and presets, a result card,
  and a 12-slot round history rail with net stats.
- **Ledger integration**: the wager debits at start and any cash-out credits
  through the existing economy store, so Wallet, Activity, and Profile stats
  update and persist immediately.
- **Rules chosen deliberately**: fixed 5 x 5 board, bomb count as the only
  difficulty dial, no flagging, no auto-clear animation on win, all bombs
  revealed only after a hit.

## Milestone 7 features

On top of the Milestone 2 through 6 game lifecycles:

- **Crash engine** (`games/crash/engine.ts`): a proper
  `GameEngine<CrashState, CrashResult>` implementation owning the rules.
  `beginRound` validates whole wagers within 100..100,000 and draws the hidden
  crash point from the Rng; `cashOut(state, multiplier)` honours any
  multiplier strictly below the point at `floor(wager x multiplier)` and
  settles everything at or past the point as a crash; `finishRound` always
  settles a crash. Purely visual randomness is impossible: the screen never
  decides an outcome.
- **Crash curve** (`games/crash/config.ts`): `HOUSE_EDGE` (1%) is baked into
  every draw, so roughly one round in a hundred crashes at 1.00x and nobody
  can cash out; `multiplierAt(elapsedMs)` gives the shared exponential rise
  curve the engine grade and the screen animation both follow, so the animated
  readout always matches authority.
- **Crash screen** (`games/crash/CrashScreen.tsx`): a dark lane shell with a
  huge tabular multiplier readout that ticks up at 20 Hz during a ride, a
  rising gauge toward the hidden crash point, a prominent green Cash-out
  button while climbing, a red CRASHED flash when the point is reached, a
  result card with the banked profit or the settled loss, a wager stepper and
  presets, and a 12-slot round history rail with net stats.
- **Ledger integration**: the wager debits when the ride starts and a
  cash-out credits through the existing economy store, so Wallet, Activity,
  and Profile stats update and persist immediately.
- **Rules chosen deliberately**: one manual cash-out per round, no auto-cash,
  no bet-with-out, no multi-bet lanes, multiplier resolved to two decimals,
  displayed and banked multipliers identical.

## Milestone 6 features

On top of the Milestone 2, 3, 4, and 5 game lifecycles:

- **Dice engine** (`games/dice/engine.ts`): a proper
  `GameEngine<DiceState, DiceResult>` implementation owning the rules.
  `beginRound` validates whole wagers within 100..100,000 and a known
  prediction; `finishRound` rolls two fair die through a crypto-backed `Rng`
  (deterministic under a seed), sums them, and settles the call.
- **Call rules** (`games/dice/config.ts`): `WAYS` maps every total 2..12 to
  its combination count, `exactMultiplier(total)` pays
  `floor((36 x 0.9) / ways)` (up to 32x for totals with one way, 5x for a
  7), and under/over pay even money. A 7 loses both sides; an exact call
  wins only on its own total.
- **Dice screen** (`games/dice/DiceScreen.tsx`): a dark pit shell with two 3D
  CSS die, an under/over pair (1:1 each), an exact-total picker (eleven chips
  labelled with their multiplier), a wager stepper and presets, a tumbling
  to-reveal animation that lands both die on the authoritative faces, a live
  caption (`2 + 5 = 7`), a result card with the payout or settled loss, and a
  12-slot round history rail with net stats.
- **Ledger integration**: the wager debits at roll and any payout credits at
  reveal through the existing economy store, so Wallet, Activity, and Profile
  stats update and persist immediately.
- **Rules chosen deliberately**: single call per round, no doubling of calls,
  standard pip orientation, totals and multipliers computed at config time.

## Milestone 5 features

On top of the Milestone 2, 3, and 4 game lifecycles:

- **Slots engine** (`games/slots/engine.ts`): a proper
  `GameEngine<SlotsState, SlotsResult>` implementation owning the rules.
  `beginRound` validates whole wagers within 100..100,000; `finishRound` picks
  fifteen weighted symbols (five reels, three rows, crypto-backed `Rng`,
  deterministic under a seed), evaluates the middle payline, and returns the
  resolved grid plus any winning line.
- **Weighted reels and paytable** (`games/slots/config.ts`): per-symbol
  weights (cherry common, seven rare), a `PAYTABLE` of 3x/4x/5x multipliers per
  symbol, and a two-cherry even-money rule.
- **Line evaluation** (`SlotsEngine.evaluate`): the longest left-to-right run
  of equal symbols across the middle row. Runs of five, four, or three pay at
  the symbol's multiplier; exactly two cherries pay 1x; anything shorter pays
  nothing. Payouts are `wager x multiplier`, awarded once at reveal.
- **Slots screen** (`games/slots/SlotsScreen.tsx`): a dark machine shell with
  five reel windows, a gold payline marker through the middle row, weighted
  reel strips that drop and stagger to a stop (CSS keyframes driven by
  per-reel duration, equal speeds), a stateful caption, a result card with the
  winning line summary, a collapsible paytable, a wager stepper and presets,
  and a 12-slot round history rail with net stats.
- **Ledger integration**: the wager debits at spin and any payout credits at
  reveal through the existing economy store, so Wallet, Activity, and Profile
  stats update and persist immediately.
- **Rules chosen deliberately**: five reels, three rows, one centre payline,
  left-to-right runs, no wilds, no scatter, no free spins.

## Milestone 4 features

On top of the Milestone 2 and 3 game lifecycles:

- **Blackjack engine** (`games/blackjack/engine.ts`): a proper
  `GameEngine<BlackjackState, BlackjackResult>` implementation owning the
  rules. Six-deck random shoe (deterministic under a seeded `Rng`), wager
  validation (whole credits within 100..100,000), a two-card deal to dealer
  and player, `hit`, `stand`, `double` (exactly one card, stake doubled),
  `split` (matching pair, once per round, second wager), automatic hand
  completion on 21/bust, dealer play to soft 17 (S17), and settlement that
  pays even money, pays naturals 3:2 (never for split hands), refunds pushes,
  and keeps doubled hands at twice their wager. The shoe auto-refills without
  breaking determinism if a round ever exhausts it.
- **Card rules** (`games/blackjack/cards.ts`): suits/ranks, per-rank values,
  hard/soft totals, bust and natural detection, and a full 52-card `DECK`.
- **Blackjack screen** (`games/blackjack/BlackjackScreen.tsx`): a felt-green
  table with the dealer row, a face-down hole card that flips when the dealer
  plays, the player hand(s) with live totals, a Hit/Stand/Double/Split action
  grid (actions appear only when legal), an explicit End round path that
  refunds the committed stake, a dealer-play interlude, a result card
  (win/loss/push with payout), a 12-slot round history rail with net stats,
  and a wager stepper plus preset chips matching the other games.
- **Multi-wager ledger integration**: the base wager debits at deal,
  split/double additions debit at the action, winning hands credit at reveal,
  and pushes refund; every step flows through the existing economy store, so
  Wallet, Activity, and Profile stats update and persist immediately.
- **Rules chosen deliberately**: six decks, dealer stands on all 17s, 3:2
  naturals, split once only, double on any two cards including after a split,
  no resplit, no surrender, no insurance.

## Milestone 3 features

On top of the Milestone 1 shell and the Milestone 2 game lifecycle:

- **Roulette engine** (`games/roulette/engine.ts`): a proper
  `GameEngine<RouletteState, RouletteResult>` implementation owning the rules:
  bet validation (known kind, straight targets within 0..36, dozen/column
  targets 1..3, whole wagers within 100..100,000, at least one bet, max 200
  bets), the win classification via `betMatches`, and multiplier payouts
  (straight 36x, dozens/columns 3x, everything else even money). The outcome
  is resolved against a crypto-backed `Rng`; the result is decided at spin
  time and the reveal is pure presentation.
- **Board rules** (`games/roulette/board.ts`): European wheel colors, dozen
  and column mapping, per-bet payouts, and `betZoneKey` for chip stacking.
- **Roulette screen** (`games/roulette/RouletteScreen.tsx`): a full betting
  table as a CSS grid (zero, 1..36, 2:1 columns, three dozens, and the even
  money strip), chip stacking with per-zone running totals, bet stepper plus
  presets, Undo last / Clear bets, a spinning wheel with orbiting ball, a
  result card (straight total payout or loss), New round reset, and a 12-slot
  round history rail. Guards: spin disabled until a chip is placed, no
  double-spin, insufficient-balance notice, and a refund path if a round is
  invalid or a payout cannot be credited.
- **Ledger integration**: the whole stake debits at spin and every winning
  bet credits at reveal, all through the existing economy store, so Wallet,
  Activity, and Profile stats update and persist immediately.

## Milestone 2 features

On top of the Milestone 1 shell:

- **Coin Flip engine** (`games/coin-flip/engine.ts`): a proper
  `GameEngine<CoinFlipState, CoinFlipResult>` implementation. The engine owns
  the rules: wager validation (min 100, max 100,000, whole credits), side
  validation, absolute even-money payout, and a crypto-backed `Rng` flip
  (seeded Rng injectable for tests). The result is decided synchronously at
  press time; the animation is pure presentation.
- **Shared betting config** (`core/game-engine/config.ts`):
  `MIN_BET`, `MAX_BET`, `BET_PRESETS`, `BET_STEP`, `clampWager()`.
- **Playable game entries**: registry flips `coin-flip` to `implemented`;
  playable `GameCard`s become links to `/play/<gameId>`.
- **Play surface**: `app/(shell)/play/[gameId]/page.tsx` resolves only
  implemented games (anything else 404s) and renders the game screen.
- **Coin Flip screen** (`games/coin-flip/CoinFlipScreen.tsx`): balance chip,
  heads/tails segmented picker, bet stepper with presets (100/500/1,000/5,000,
  Min, Max), a 3D CSS coin that lands on the winning side, win/loss result
  card, and a New round reset. Rapid double-submission guard, insufficient-
  balance guard, click-feedback sound/haptics per interaction, and a refund
  path if a round is invalid or the payout cannot be credited.
- **Ledger integration**: bets debit and wins credit through the existing
  economy store, so Wallet, Activity, and Profile stats update immediately
  and persist across restarts.

## Milestone 1 features

Milestone 1 builds the full app shell on top of Milestone 0:

- **Native app chrome**: mobile bottom tab bar and desktop sidebar (one shell,
  CSS-only switch at 768px), large-title page headers, translucent tab bar
  with `backdrop-filter`, safe-area-aware padding (`--a-safe-*`,
  `viewport-fit=cover`).
- **Navigation**: `/`, `/games`, `/wallet`, `/activity`, `/profile`,
  `/settings`, `/about`, plus hidden `/foundation` for the system-status
  milestone surface. Active-route highlighting for tabs and sidebar.
- **Real audio foundation**: WebAudio engine (`core/audio/web-engine.ts`,
  lazy `AudioContext` for autoplay policies, per-event tone sequences) with a
  noop fallback for tests. `lib/app-feedback.ts` unifies sound + haptics,
  both honouring the Settings toggles.
- **Feedback layer**: taps, navigation, selects, wins, losses, and errors
  trigger matching sounds and vibration (web vibrate).
- **Home**: greeting, one-time welcome/onboarding card, balance card that
  opens Wallet, featured games, recent activity.
- **Game library**: all ten `conceptual` games as cards with their target
  milestone; nothing playable yet by design.
- **Wallet**: balance card plus recent transactions and disclaimer copy.
- **Activity**: full ledger grouped by day with friendly relative timestamps.
- **Profile**: welcome-allocation and net-result summary rows, links to
  Settings and About.
- **Settings**: theme picker, sound/haptics switches (persisted, wired to the
  feedback engines), storage info, two-tap data reset.
- **About & legal**: simulation policy, milestone-built games explanation,
  live system-status readout, version/build line.
- **Shared UI primitives**: `Button`, `Switch`, grouped `ListGroup`/`ListRow`
  (iOS inset-grouped style), `EmptyState`, `GameCard`, `LargeTitle`, and a
  hand-drawn stroke icon set.

Milestone 0 features (all inherited): strict TS, design tokens, 11-theme
system, persistence layer, economy ledger, game-engine contracts,
randomness, error/logging foundations, PWA shell metadata.

## Known issues

- First paint uses a dark fallback before theme variables apply client-side.
- No raster app icons yet (SVG only).
- WebAudio + vibration depend on platform/browser support; they degrade
  silently (this is intentional).

## Manual verification checklist

Automated gates:

- [x] `pnpm check` (typecheck + lint + test) passes.
- [x] `pnpm build` completes and `pnpm start` serves HTTP 200.

Manual:

- [ ] `pnpm dev` starts and http://localhost:3000 renders the device-appropriate
      chrome (tab bar on narrow, sidebar on wide).
- [ ] Home shows the welcome card once; dismissing it persists.
- [ ] Tabs navigate without full page reloads and highlight the active route.
- [x] Games library lists all ten entries; every game, including Wheel and
      Hi-Lo, is marked Playable and links to `/play/<gameId>`.
- [ ] Wallet shows the 25,000 cr welcome allocation and the
      `initial-allocation` transaction after mounting.
- [ ] Activity groups transactions by day with readable timestamps.
- [ ] Settings toggles for sound/haptics persist across refresh and audibly
      change tap feedback on devices that support it.
- [ ] Theme changes persist and recolour the whole shell.
- [ ] About shows the simulation policy and live system status.
- [ ] Refresh preserves balance, theme, and settings.
- [ ] Install-as-PWA shows manifest metadata (icon, name, standalone).

Coin Flip manual verification:

- [ ] Launch and open Games → Coin Flip (or `/play/coin-flip`).
- [ ] Create a virtual bet: pick a side, adjust the wager with stepper and
      presets.
- [ ] Complete a coin flip; the result matches your call or lands the other
      side.
- [ ] Confirm the balance updates (win credits 2x, loss keeps the stake).
- [ ] Confirm the transaction history shows a `Bet placed` and a `Win` row
      for each round, with the coin-flip game id.
- [ ] Confirm persistence: refresh after a winning round, balance and
      transactions survive.
- [ ] Confirm restart behaviour: `pnpm start` after a `pnpm build`, then play
      another round.
- [ ] Confirm rapid double-taps on Flip only create one round.
- [ ] Confirm an invalid state is prevented: Flip is disabled until a side and
      a valid wager are set, and disabled when the wager exceeds the balance.

Roulette manual verification:

- [ ] Launch and open Games → Roulette (or `/play/roulette`).
- [ ] Place chips: tap number cells, the zero, the 2:1 columns, the 1st/2nd/
      3rd 12, and the even-money strip; totals accumulate per zone and the
      stake line updates.
- [ ] Undo last removes the most recent chip; Clear bets empties the table;
      Spin is disabled until at least one chip is placed.
- [ ] Complete a spin; the wheel animates, the ball settles on a number, and
      the result card shows win or no-match (highlighted winning zone).
- [ ] Confirm the balance updates: all winning bets credit at reveal, a losing
      spin keeps the stake.
- [ ] Confirm the ledger shows a `Bet placed` row (whole stake) and a `Win`
      row for any round that pays out.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on Spin only create one round.
- [ ] Confirm invalid states are prevented: Chip buttons are inert during the
      spin, and placing a chip is impossible once the balance is below the
      wager.

Blackjack manual verification:

- [ ] Launch and open Games → Blackjack (or `/play/blackjack`).
- [ ] Set the wager with the stepper and presets; Deal is disabled when the
      wager exceeds the balance.
- [ ] Deal a round; four cards appear (dealer upcard, dealer hole face down,
      player pair). Blackjack on the deal resolves immediately at 3:2.
- [ ] Hit draws a card; busting ends the hand and the dealer resolves.
- [ ] Stand passes the turn; with a split, the play moves to Hand 2.
- [ ] Double adds a second wager and draws exactly one card; Split on a pair
      creates two hands and a second wager (once per round).
- [ ] End round returns the whole committed stake and returns to the wager.
- [ ] The dealer plays to 17 after the player finishes; the hole card flips
      and totals appear.
- [ ] Confirm the settlement: win pays even money (or 3:2 on a natural), a
      push refunds the stake, double/split wins pay on the doubled stake.
- [ ] Confirm the ledger shows the base `Bet placed`, any `Bet placed` rows
      for doubling/splitting, and either a `Win` or `Round returned` row at
      reveal.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on Hit/Stand only act once per hand.

Slots manual verification:

- [ ] Launch and open Games → Slots (or `/play/slots`).
- [ ] Set the wager with the stepper and presets; Spin is disabled when the
      wager exceeds the balance.
- [ ] Spin; all five reels roll and stop one at a time, left to right, and the
      landing grid matches the result the machine resolves.
- [ ] A three-or-more-of-a-kind run rings the winning cells in the middle row
      and pays the per-symbol multiplier (2 cherries pays even).
- [ ] Confirm the balance updates: losing spin keeps the wager, a win credits
      `wager x multiplier` at reveal.
- [ ] Confirm the ledger shows a `Bet placed` row and a `Win` row for any
      round that pays out.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on Spin only create one round.
- [ ] Confirm invalid states are prevented: the spinner controls are disabled
      while the reels are running, and a spin is impossible once the balance
      is below the wager.
- [ ] Confirm the Payouts panel lists the symbol table and 2-cherry rule.

Dice manual verification:

- [ ] Launch and open Games → Dice (or `/play/dice`).
- [ ] Set the wager with the stepper and presets; Roll is disabled when the
      wager exceeds the balance.
- [ ] Pick a call: Under 7, Over 7, or one of the eleven exact totals. Roll is
      disabled until a call is made.
- [ ] Roll; the two die tumble and land on the strong results the engine
      resolves, and the caption reports `die1 + die2 = total`.
- [ ] An under call wins on totals 2-6 at 1:1; an over call wins on 8-12 at
      1:1; a 7 loses both sides.
- [ ] An exact call wins only on its own total and credits at the multiplier on
      the chip (up to 32x).
- [ ] Confirm the balance updates: losing roll keeps the wager, a win credits
      `wager x multiplier` at reveal.
- [ ] Confirm the ledger shows a `Bet placed` row and a `Win` row for any
      round that pays out.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on Roll only create one round.
- [ ] Confirm invalid states are prevented: the call and wager controls are
      disabled while the die are rolling, and a roll is impossible once the
      balance is below the wager.

Crash manual verification:

- [ ] Launch and open Games → Crash (or `/play/crash`).
- [ ] Set the wager with the stepper and presets; Start is disabled when the
      wager exceeds the balance.
- [ ] Start a ride; the multiplier climbs in the readout and the gauge rises.
- [ ] Cash out while the bus is below its hidden point; the balance credits
      `wager x multiplier` (multiplier floored to whole credits) and the
      result card shows the banked profit.
- [ ] Let a ride run to its point; the readout flashes CRASHED, the gauge
      bleeds red, and the wager stays with the house.
- [ ] Confirm the ledger shows a `Bet placed` row at start and a `Win` row
      only for rounds that were cashed out.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on Start only create one ride, and a second
      Cash-out tap cannot bank twice.
- [ ] Confirm invalid states are prevented: the wager controls are disabled
      during a ride, and a ride is impossible once the balance is below the
      wager.

Mines manual verification:

- [ ] Launch and open Games → Mines (or `/play/mines`).
- [ ] Pick a bomb count and set the wager with the stepper and presets; Start
      is disabled when the wager exceeds the balance.
- [ ] Reveal tiles: safe tiles flip to a gem mark and the cash-out multiple
      climbs; the next-tile preview updates.
- [ ] Cash out after one or more safe tiles; the balance credits
      `wager x multiplier` and the result card shows the banked profit.
- [ ] Hit a bomb; the board shudders red, all bombs reveal with a stagger, and
      the wager stays with the house.
- [ ] Revealing every safe tile auto-cashes the round at the top multiple.
- [ ] Confirm the ledger shows a `Bet placed` row at start and a `Win` row
      only for rounds that were cashed out.
- [ ] Confirm persistence: refresh after a round, balance and transactions
      survive.
- [ ] Confirm rapid double-taps on a tile only reveal it once, and a Cash-out
      tap cannot bank twice.
- [ ] Confirm invalid states are prevented: tiles are inert between rounds,
      and a round is impossible once the balance is below the wager.

Plinko manual verification:

- [ ] Launch and open Games → Plinko (or `/play/plinko`).
- [ ] Pick a board size and set the wager with the stepper and presets; Drop
      is disabled when the wager exceeds the balance.
- [ ] Drop the ball; it bounces one step per peg row and lands in a slot that
      lights up with its multiplier.
- [ ] Confirm the balance reflects the wager immediately and the slot payout
      the moment the round lands.
- [ ] Confirm the ledger shows a `Bet placed` row and a `Win` row per drop,
      and that refresh after a drop keeps balance and transactions.
- [ ] Drop on the 16-row board and confirm the multiplier lanes re-render and
      the ball never lands outside the lanes.
- [ ] Confirm the ball always lands in the slot the engine resolved: land the
      round, watch the slot light, then compare with the history tile.
- [ ] Confirm a second drop cannot start before the animation finishes, and
      New round clears the board.
- [ ] Confirm invalid states are prevented: the field is inert between
      rounds, and a round is impossible once the balance is below the wager.

Wheel manual verification:

- [ ] Launch and open Games → Wheel (or `/play/wheel`).
- [ ] Set the wager with the stepper and presets; Spin is disabled when the
      wager exceeds the balance.
- [ ] Spin the wheel; it accelerates then decelerates and the pointer stops
      inside one wedge.
- [ ] Confirm the balance reflects the wager immediately and the wedge payout
      the moment the spin stops.
- [ ] Confirm the ledger shows a `Bet placed` row and a `Win` row per spin,
      and that refresh after a spin keeps balance and transactions.
- [ ] Confirm the landed wedge matches the result card and history tile
      (compare against the odds panel shares).
- [ ] Confirm a second spin cannot start before the animation finishes, and
      New round arms the wheel again.
- [ ] Confirm invalid states are prevented: the wheel is inert between
      rounds, and a round is impossible once the balance is below the wager.

Hi-Lo manual verification:

- [ ] Launch and open Games → Hi-Lo (or `/play/hi-lo`).
- [ ] Set the wager with the stepper and presets; Deal is disabled when the
      wager exceeds the balance.
- [ ] Deal; a top card appears face up next to a face-down card, and the three
      call buttons show their live multipliers and remaining-card counts.
- [ ] Confirm Higher is disabled over an Ace and Lower is disabled under a Two.
- [ ] Call a side; the hidden card flips and the result matches the call.
- [ ] Confirm the balance reflects the wager immediately and the payout the
      moment the call settles.
- [ ] Confirm the ledger shows a `Bet placed` row and a `Win` row per win, and
      that refresh after a round keeps balance and transactions.
- [ ] Confirm a second call cannot be made mid-round, and New round deals
      again.
- [ ] Confirm invalid states are prevented: the table is inert between rounds,
      and a round is impossible once the balance is below the wager.

Milestone 11 manual verification:

- [ ] Play a few rounds across different games, then open Activity
      (`/activity`): the stat grid, By-game chart, and Highlights list match
      the real ledger (wins/losses, per-game totals, largest win/loss).
- [ ] The By-game chart centers each game's bars on zero: gains grow up in
      the success colour, losses down in the danger colour.
- [ ] Open Wallet (`/wallet`): the Balance-trend card draws a line from the
      old balance to the current one and labels the observed range.
- [ ] Settings: drag the volume slider and hear tapping get quieter/louder;
      "Test sound & haptics" plays a distinct select/bet/win/loss sequence and
      vibrates on capable devices.
- [ ] Profile: type a name, Save, and reload - the Home greeting greets that
      name; clearing it falls back to "Guest".
- [ ] Refresh after rounds: stats recompute from the persisted ledger and
      nothing drifts from Wallet or Profile numbers.

Milestone 12 manual verification:

- [ ] With focus on the page body (nothing focused), Space and Enter trigger
      the primary action on every game: coin-flip flip, dice roll, roulette
      spin, slots spin, blackjack deal, crash start and cash-out mid-climb,
      mines start and cash-out, plinko drop, wheel spin, hi-lo deal; after a
      result they start the next round.
- [ ] Tabbing to a button and pressing Space/Enter activates that control only
      (no double round from the shortcut overlay).
- [ ] Focus the browser and press Tab: the "Skip to content" link appears,
      Enter jumps to the main content; active tabs announce a current page in
      the accessibility tree (aria-current) and the two navs read distinctly.
- [ ] Close any tab bar nav near a game; the shortcut never races a click.
- [ ] Refresh a themed screen: theme-color follows the palette; charts still
      animate the same (easing token unchanged in look).

## Architecture decisions

- **Next.js/React + TS** chosen over Expo/Tauri/Flutter to develop fully on
  Windows; native-like feel pursued via design system, PWA shell, and
  platform-conventions-oriented UI (HIG-informed habits).
- **Zustand** for state: small, typed, minimal boilerplate, predictable.
- **Persistence centralised behind `core/persistence`** with versioned
  envelopes rather than isolating zustand's own middleware; components never
  touch storage directly.
- **Economy as a pure rule module** (`core/economy/ledger.ts`) with the store
  as thin binding: unit-testable without React.
- **Palette derivation** from a small set of base colors keeps the 11 themes
  consistent and guarantees structural completeness of every palette.
- **Native-app feel** via Apple system curves/palettes for `system` appearance,
  SF-first font stack, 44px touch targets, safe-area-aware layout, and
  platform-conventions-based chrome (tab bar on iPhone, sidebar on wider
  layouts).
- **Feedback as a cross-cutting concern**: `lib/app-feedback` owns engine
  singletons; Settings writes flow through the same module so sound and
  haptics always match preference state.

## Technical debt

- WebApp `AudioContext` is created lazily on the first played event; the very
  first sound happens on tap, which satisfies autoplay policies.
- Theme first-paint fallback.
- SVG-only manifest icons.
- `tests/setup.ts` provides mocks for `matchMedia` and `next/navigation`;
  shell tests assume the `/` route for pathname.
- Tab bar and sidebar are both in the DOM (one hidden by CSS); harmless but
  slightly redundant markup.

## Next milestone

**Not yet planned.** The remaining candidates, deliberately held back, are the
Milestone 11 simulation laboratory and streak statistics (with their
gameplay/simulation data separation rule), and broader platform work
(native wrappers, raster icon set). No new milestone begins until explicitly
instructed.

## Deferred ideas

- Native wrapper (macOS/iOS) after web shell matures.
- Raster icon set and install polish.
- Milestone 11 simulation laboratory and streak statistics (simulation data
  must be kept clearly distinct from gameplay data).
- Service-worker offline strategy.