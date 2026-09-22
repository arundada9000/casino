# Design System

## Token strategy

All visual values live in `design/tokens/` as TypeScript constants: never
hard-coded in components. A single function (`resolveCssVariables`) expands
them into CSS variables prefixed `--a-`:

- dynamic, theme-dependent values (colors, shadows) are injected by
  `ThemeProvider` per theme;
- static values (space, type, radius, durations, easings, breakpoints,
  control/icon sizes) are identical for every theme and included in the same
  variable set.

Fallbacks are supplied at every `var(...)` usage so a component still renders
sensibly before variables are applied.

## Token families

| Family       | File (in `design/tokens/`)  | Examples                                   |
| ------------ | --------------------------- | ------------------------------------------ |
| Color        | `slots.ts`                  | 31 semantic roles: surfaces, text, accent, alert colors, focus, scrim, shadows, skeleton |
| Scale        | `scale.ts`                  | space, radius, font, type scale, icon sizes, control sizes, breakpoints, durations, easings, shadow/elevation steps, surface hierarchy |

`design/color/utils.ts` provides color math: hex parse, alpha, blend, mix,
luminance, `contrastRatio`, `readableText`.

## Theming

Defined in `design/themes/`:

- 11 presets: `system`, `midnight` (default dark), `obsidian`, `ivory`,
  `crimson`, `emerald`, `sapphire`, `violet`, `sepia`, `slate`, `cloud`.
- Each theme declares a small base palette; `buildPalette` derives the rest
  (secondary/muted text, borders, accent hovers, soft tints, focus ring,
  skeleton colors, shadow/scrim colors) for consistency.
- `resolveTheme(themeId, prefersDark)` maps `system` to **slate** (dark) or
  **cloud** (light).
- `ThemeProvider` applies `data-theme`, `data-color-scheme`, the inline
  `color-scheme`, and all CSS variables; it also updates the meta
  `theme-color`.
- `useTheme()` exposes `{ themeId, resolved, setTheme }`.

Contrast is enforced structurally: the derived `textOnAccent` is computed
from each accent's luminance, and the test suite asserts readable primary
text on every theme background.

## Motion & accessibility

- Motion tokens: durations (`quick` 80ms → `slowest` 700ms) and easing curves
  (`standard`, `entrance`, `exit`, `out`, `emphasize`, `linear`), matching
  Apple's system curves.
- `useReducedMotion` and a global `prefers-reduced-motion: reduce` rule
  collapse animations.
- Focus-visible rings use the theme `focusRing` color.
- Touch targets default to ≥ 44px (`minTouchTarget`).

## Native platform alignment

Aurelia is a web app that should feel like a native iOS/macOS product:

- **System appearance** resolves to Apple system colors: `slate` mirrors the
  iOS/macOS dark palette (true-black canvas, `#1c1c1e` surfaces, system blue
  `#0a84ff`), `cloud` mirrors the light palette (`#f2f2f7` canvas, `#ffffff`
  surfaces, `#007aff` accent). Light/dark "System" users get genuine
  platform-neutral colors; the casino presets remain available as intentional
  brands.
- **Typography** uses the system stack first (`-apple-system` /
  `SF Pro Text`), so native Apple rendering wins on iOS and macOS.
- **Motion** follows Apple's curves and durations: `standard` (ease-in-out
  `0.32,0.72,0,1`), `entrance` (deceleration `0,0.55,0.45,1`), `exit`
  (acceleration `0.55,0.05,0.55,0.05`); transitions run about 200-350ms and
  speed up for interruption.
- **Touch** follow HIG: 44px minimum targets, `env(safe-area-inset-*)`
  respected in layouts, `viewport-fit=cover` for edge-to-edge, and iOS
  status-bar theming via web-app meta tags.
- Milestone 1 chrome adapts per platform: a tab bar on iPhone, a native
  sidebar on iPad/macOS wide layouts (both live in `components/shell/`).

## Conventions

- Components use CSS Modules; cross-component consistency comes entirely from
  tokens.
- Elevations reference shadow tokens via `var(--a-color-shadow)` so elevation
  adapts to the active theme.
- When a new visual value is needed, add a token first. Do not hard-code it
  in a component.