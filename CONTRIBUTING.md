# Contributing to Aurelia

Thanks for your interest in contributing! Aurelia is a fictional casino
simulation built for engineering practice - it uses virtual credits only and
never touches real money.

## Ground rules

- Aurelia simulates gambling mechanics for learning and portfolio purposes.
  It does not implement wagering, deposits, or payouts in any currency.
- Games are governed by a single source-of-truth economy ([docs/economy.md](docs/economy.md)).
  New games **must** route every credit movement through the ledger.
- Determinism matters: game engines are pure where possible. Randomness goes
  through `core/randomness` so it can be seeded and tested.
- This project follows an explicit milestone discipline - see
  [docs/development-tracker.md](docs/development-tracker.md). Substantial
  features are landed as milestones with their own verification gates.

## Development setup

Requirements:

- Node.js >= 20.9
- pnpm 10.x (`corepack enable` works with the pinned `packageManager` field)

```bash
pnpm install       # install dependencies
pnpm dev           # start the dev server on http://localhost:3000
pnpm check         # typecheck + lint + tests
pnpm build         # production build
```

## Workflow

1. Fork the repository and create a feature branch from `main`.
2. Implement the change. Prefer small, reviewable commits.
3. Add or update tests - the project keeps a 1:1 mapping between engines and
   engine test suites.
4. Run the full gate locally before pushing:

   ```bash
   pnpm check && pnpm build
   ```

5. Open a pull request. Describe what changed, why, and how it was verified.

## Code style

- TypeScript strict. No `any` without a documented justification.
- Prefer pure functions; keep game engine code free of React.
- UI lives in `components/`, screens compose them. CSS Modules per component.
- No hard-coded colors outside `design/`; reference design tokens.
- Formatting and import ordering follow the ESLint configuration - run
   `pnpm lint` locally.

## Architecture overview

| Layer            | Location                | Responsibility                              |
| ---------------- | ----------------------- | ------------------------------------------- |
| Core             | `core/`                 | Economy, persistence, randomness, logging   |
| Design system    | `design/`               | Tokens, palettes, themes, CSS variables     |
| Game engines     | `games/*/engine.ts`     | Pure, testable game rules                   |
| Game screens     | `games/*/*Screen.tsx`   | React presentation for each game            |
| Stores           | `stores/`               | Zustand state (economy, settings)           |
| App shell        | `app/`, `components/`   | Routing, layout, shared UI                  |

See [docs/architecture.md](docs/architecture.md) for the full picture.

## Testing

- Vitest with jsdom + React Testing Library.
- `pnpm test` runs everything once; `pnpm test:watch` for iteration.
- Engine suites are pure-logic; screen suites cover interaction and
  accessibility. See [docs/testing.md](docs/testing.md).

## Reporting issues

- Search existing issues first.
- Include: expected vs actual behaviour, reproduction steps, and the build
  version from the About screen or `lib/app.ts`.
- Security-sensitive findings → read [SECURITY.md](SECURITY.md) and report
  privately.

## Code of conduct

All contributors are expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).