# Architecture

## Stack

- **Next.js 16 (App Router)** with React 19 + TypeScript (strict).
- **pnpm** for dependency management.
- **Zustand** for predictable client-side state with a centralised, versioned
  persistence layer.
- **Vitest + React Testing Library** for tests.
- Plain **CSS Modules** styled via a central CSS-variable design system.

The app currently boots and runs entirely on the web target (the chosen
platform for development on Windows). The architecture deliberately keeps
platform-specific concerns behind small interfaces so the same modules can be
hosted as a PWA or inside a native wrapper later.

## Module map

| Module        | Responsibility                                                       |
| ------------- | -------------------------------------------------------------------- |
| `app/`        | Routes, root layout, bootstrap providers, error/not-found surfaces.  |
| `components/` | Presentational components and foundation screens.                    |
| `core/economy`  | The virtual-credit ledger: every balance change is an audited transaction. |
| `core/game-engine` | Game catalogue and engine contracts. No game implementations yet. |
| `core/persistence` | Storage adapter abstraction; versioned, corruption-resistant payloads. |
| `core/randomness`  | RNG interface, crypto-backed source, seeded PRNG for tests. |
| `core/audio`   | Sound engine interface + WebAudio implementation + noop fallback.  |
| `core/haptics` | Haptic engine interface + web/vibrate and noop implementations.      |
| `core/error`   | Typed application errors and a React error boundary.                |
| `core/logging` | Scoped, level-gated logger.                                         |
| `design/tokens` | The full token scale (space, type, radius, shadows, motion, icons, controls). |
| `design/themes` | Theme presets, palette derivation, `ThemeProvider`, CSS variable injection. |
| `hooks/`       | `useMounted`, media queries, reduced-motion preference.             |
| `lib/`         | Formatting, id generation, route catalogue.                        |
| `stores/`      | Zustand stores (settings, economy).                                |
| `tests/`       | Vitest configuration and test suites.                               |

## Rendering model

- The **root layout** is a server component; the app-specific `Providers`
  wrap children in a client context: `ErrorBoundary` → `ThemeProvider`.
- **Client stores rehydrate from localStorage after mount.** SSR renders
  neutral content (balances shown as placeholders) to avoid hydration
  mismatches. Screens that read persisted values gate their output behind
  `useMounted`.
- Themes are applied by setting CSS variables on `documentElement` after
  mount; static fallbacks exist for the first paint.

## Data flow

```
Component ──action──▶ Store ──reads/writes──▶ Persistence layer
                         │
                         └──▶ Economy ledger (all balance changes audited)
                         └──▶ ThemeProvider (CSS variables, data-theme)
Game UI ──renders──▶ GameEngine result (engine is authoritative)
```

## Integrity rules

1. **No game or UI component mutates the wallet directly.** All changes go
   through `core/economy` functions, which validate amounts, cap the ledger,
   and record an audit transaction first.
2. **Persistence is centralised and versioned.** Values are stored as
   `{ v, data }`. On version mismatch or corruption, stores fall back to
   defaults rather than crashing or trusting bad data.
3. **Game results belong to the engine.** The UI animates whatever the engine
   reports; it never decides outcomes. (Contract defined in Milestone 0;
   no engine implementations exist yet.)
4. **Randomness is deterministic when seeded** so game logic can be tested
   exactly, and crypto-backed in production, with simulation logic separate
   from rendering.

## Known limitations (deferred)

- WebAudio and vibration depend on browser/platform support; they degrade
  silently by design.
- Theme first paint uses a dark fallback before client variables apply; a
  flash-avoidance pass is deferred to Milestone 12 polish.
- PWA icons are SVG only; proper raster icons on a macOS/iOS pass.
- No game is implemented: registry entries are `conceptual` until their
  milestone.

## Routing plan

Route catalogue lives in `lib/router.ts`. The shell activates the real
routes: root home, `games`, `wallet`, `activity`, `profile`, `settings`,
`about`. The foundation/system-status surface now lives at `/foundation`.