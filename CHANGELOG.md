# Changelog

All notable changes to this project are documented in this file.
Dates follow the repository history; version bumps follow milestone releases.
See [docs/development-tracker.md](docs/development-tracker.md) for the full
milestone diary.

## [0.13.0] - 2026-09-22

### Milestone 12 · Final Product Polish

#### Added
- Skip-to-content link, `aria-current="page"`, and distinct landmark labels
  for the sidebar and tab-bar navigation.
- Keyboard shortcuts on every play screen: Space/Enter from the body mirrors
  the live primary action (flip, roll, deal, spin, cash out, new round).

#### Changed
- Wired `hooks/usePrimaryActionKey` into all ten game screens.
- Memoized day grouping and recent-transaction projections on the Wallet and
  Activity screens.
- Fixed an invalid easing token in the balance chart (now `--a-ease-standard`).

#### Test
- New keyboard-shortcut suite; extended shell accessibility tests.
- 269 tests across 24 suites.

## [0.12.0] - 2026-09-21

### Milestone 11 · Insights & Polish

#### Added
- Per-game statistics: top return, most/least rewarding game, bets and win
  rates.
- Wallet gain/loss charts by day and per-game, seeded-demo insights section,
  and a new "Needs work" callout.
- Sound volume control with preview tones, and profile identity editing that
  personalises the Home greeting.

#### Changed
- Reworked Wallet, Activity, Profile, and Settings screens around the
  governed ledger.

## [0.11.0] - 2026-09-21

### Milestone 10 · Wheel and Hi-Lo

#### Added
- Wheel: a weighted multiplier wheel.
- Hi-Lo: a higher-or-lower card guess game.

Both complete the ten-game library registered in Milestone 1.

## [0.10.0] - 2026-09-21

### Milestone 9 · Plinko

#### Added
- Plinko ball-drop with a deterministic peg-field physics simulation and
  fixed-fee pay rates.

## [0.9.0] - 2026-09-21

### Milestone 8 · Mines

#### Added
- Mines: grid reveal with configurable danger density and risk-adjusted
  multiplier growth.

## [0.8.0] - 2026-09-21

### Milestone 7 · Crash

#### Added
- Crash: a multiplier that climbs until a random bust point.
- Cash-out mitigates house edge; live round state and result beacons.

## [0.7.0] - 2026-09-21

### Milestone 6 · Dice

#### Added
- Dice: predict-the-roll wager with a configured house edge and history.

## [0.6.0] - 2026-09-21

### Milestone 5 · Slots

#### Added
- Slots: configurable reels with floor-weighted payout design.

## [0.5.0] - 2026-09-12

### Milestone 4 · Blackjack

#### Added
- Blackjack: dealer logic, 21 outs, busts, blackjacks, and push handling.

## [0.4.0] - 2026-09-12

### Milestone 3 · Roulette

#### Added
- European roulette with a full table and board layout.

## [0.3.0] - 2026-09-12

### Milestone 2 · Coin Flip

#### Added
- Coin flip: the first playable game, complete with animation and history.

## [0.2.0] - 2026-09-12

### Milestone 1 · Core App Shell

#### Added
- App chrome: sidebar, mobile tab bar, and navigation shell.
- Home dashboard, games catalogue, Foundation, Wallet, Activity, Profile,
  Settings, and About screens.
- Design system: token scale, brand palettes, CSS variables, and theme
  switching.
- Feedback engine: deterministic audio tones and light haptics.
- Error boundary, 404, and global error screens.

## [0.1.0] - 2026-09-12

### Milestone 0 · Foundation

#### Added
- Governed economy ledger with transaction provenance.
- Stream-safe persistence and safe storage adapters.
- Seeded, crypto, and RNG randomness utilities.
- Error taxonomy, logging infrastructure, and game-engine catalogue.

[0.13.0]: https://github.com/example/aurelia/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/example/aurelia/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/example/aurelia/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/example/aurelia/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/example/aurelia/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/example/aurelia/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/example/aurelia/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/example/aurelia/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/example/aurelia/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/example/aurelia/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/example/aurelia/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/example/aurelia/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/example/aurelia/commits/v0.1.0