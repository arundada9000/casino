# Aurelia - Casino Simulation

A premium **fictional casino simulation** for iPhone, iPad, macOS, and desktop
browsers. Ten games, one governed economy, and a native-feeling interface -
built with Next.js, React, TypeScript, and pnpm.

> **Important.** This is a simulation and entertainment product. There is
> **no real-money gambling, deposits, withdrawals, cash-out, cryptocurrency,
> or prizes with monetary value**. Every currency shown is fictional and
> exists purely for gameplay.

## Highlights

- **Ten complete games** - Coin Flip, Roulette, Blackjack, Slots, Dice,
  Crash, Mines, Plinko, Wheel, and Hi-Lo.
- **Single source-of-truth economy** - every credit movement is a governed,
  auditable ledger transaction with game and round provenance.
- **Native-like experience** - tactile animations, synthesized WebAudio
  sound, light haptics, dark/light theming, and PWA metadata.
- **Deterministic engines** - game rules are pure and seeded, so every round
  is testable and replayable.
- **Insights** - per-game profit/loss, balance-over-time charts, win rates,
  and best/needs-work callouts, all rendered with hand-rolled SVG.
- **Accessibility** - skip-to-content, distinct navigation landmarks,
  `aria-current`, keyboard shortcuts on every play screen, reduced-motion and
  focus-visible awareness.

## Tech stack

| Area      | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router)       |
| UI        | React 19, CSS Modules, design tokens                |
| State     | Zustand 5 with versioned persistence                |
| Language  | TypeScript 5 (strict)                               |
| Tooling   | pnpm 10, Vite (via Vitest)                     |
| Tests     | Vitest + React Testing Library (jsdom)              |
| CI        | GitHub Actions (typecheck, lint, test, build)       |

Requires Node.js >= 20.9.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command          | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Start the development server                |
| `pnpm build`     | Production build                            |
| `pnpm start`     | Serve the production build                  |
| `pnpm lint`      | ESLint (Next.js + TypeScript rules)         |
| `pnpm typecheck` | `tsc --noEmit`                              |
| `pnpm test`      | Run unit / component tests (Vitest)         |
| `pnpm check`     | typecheck + lint + test bundle              |

## The games

| Game       | Milestone | What you play                                                   |
| ---------- | --------- | --------------------------------------------------------------- |
| Coin Flip  | M2        | Call heads or tails and watch the flip                           |
| Roulette   | M3        | European wheel with multi-chip betting on a full table           |
| Blackjack  | M4        | Six-deck shoe, hit/stand/double/split, dealer to 17, 3:2 pays    |
| Slots      | M5        | Five weighted reels, one payline, left-run scoring               |
| Dice       | M6        | Two fair die, under/over-seven and exact-total calls             |
| Crash      | M7        | A multiplier that climbs until a random bust point               |
| Mines      | M8        | 5 x 5 minefield; reveal safe tiles and cash out                  |
| Plinko     | M9        | Configurable peg field with an EV-normalized payout ladder       |
| Wheel      | M10       | Weighted wheel of multipliers, honest 0.99 return                |
| Hi-Lo      | M10       | Higher/Lower/Equal priced at the true remaining-deck odds        |

Every game ends in a ledger transaction and round history - no gameplay, no
credits. Each engine ships with a matching test suite.

## Project structure

```
app/            Next.js routes: shell layout, home, games, wallet, activity,
                profile, settings, about, play/[gameId], error/not-found
components/     shell, UI primitives, activity/about rows, wallet, stats
core/           Framework-independent subsystems
  economy/        virtual-credit ledger and transaction rules
  game-engine/    game catalogue + engine contracts + shared bet config
  persistence/    versioned, stream-safe storage layer
  randomness/     crypto and seeded RNG
  audio/          WebAudio engine with noop fallback
  haptics/        haptic abstraction (web vibrate)
  error/          typed errors + error boundary
  logging/        scoped logger
design/         token scale, theme presets, CSS variable generation
games/          one folder per game (coin-flip ... hi-lo)
hooks/          shared React hooks (mounted, media queries, motion, keys)
lib/            general utilities, feedback wiring, ledger helpers, stats
stores/         Zustand stores (economy, settings) with persistence
tests/          Vitest suite (engines, screens, persistence, a11y)
docs/           architecture, economy, design, testing, tracker
```

## Documentation

| Document                                    | Contents                                    |
| ------------------------------------------- | ------------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | System architecture and module responsibilities |
| [docs/economy.md](docs/economy.md)           | Virtual-credit economy rules and audit model |
| [docs/game-engine.md](docs/game-engine.md)   | Engine contracts and round lifecycle         |
| [docs/design-system.md](docs/design-system.md) | Design tokens and theme system             |
| [docs/testing.md](docs/testing.md)           | Testing approach and coverage                |
| [docs/development-tracker.md](docs/development-tracker.md) | Milestones, gates, decisions         |
| [CHANGELOG.md](CHANGELOG.md)                 | Release history                              |

## Development discipline

This project is built **one milestone at a time**. A milestone is never
considered complete until it passes typecheck, lint, the full test suite, a
production build, and a manual verification checklist recorded in
[docs/development-tracker.md](docs/development-tracker.md).

The current release is **0.13.0, Milestone 12 (Final Product Polish)**.
See the [tracker](docs/development-tracker.md) and [changelog](CHANGELOG.md)
for where the project has been and where it is going.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, code
style, and testing expectations. This project follows the
[Contributor Covenant](CODE_OF_CONDUCT.md) and maintains a
[security policy](SECURITY.md).

## License

[MIT](LICENSE) (c) 2026 Aurelia contributors.