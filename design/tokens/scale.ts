export const space = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export type SpaceKey = keyof typeof space;
export type SpaceValue = (typeof space)[SpaceKey];

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;

export const font = {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    '"SF Pro Text"',
    "system-ui",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(", "),
  serif: ['"Times New Roman"', "Georgia", "Cambria", "serif"].join(", "),
  mono: ['"SF Mono"', "ui-monospace", "Menlo", "Consolas", "monospace"].join(", "),
} as const;

export interface TypeStyle {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
}

export const type = {
  caption: { size: 12, weight: 400, lineHeight: 16, letterSpacing: 0.2 },
  footnote: { size: 13, weight: 400, lineHeight: 18, letterSpacing: 0.1 },
  subheadline: { size: 15, weight: 400, lineHeight: 20, letterSpacing: 0.1 },
  body: { size: 16, weight: 400, lineHeight: 24, letterSpacing: 0.1 },
  headline: { size: 17, weight: 600, lineHeight: 24, letterSpacing: 0 },
  title3: { size: 20, weight: 600, lineHeight: 26, letterSpacing: 0 },
  title2: { size: 24, weight: 700, lineHeight: 30, letterSpacing: 0 },
  title1: { size: 32, weight: 700, lineHeight: 38, letterSpacing: -0.2 },
  display: { size: 42, weight: 700, lineHeight: 48, letterSpacing: -0.5 },
} as const satisfies Record<string, TypeStyle>;

export type TypeKey = keyof typeof type;

export const iconSize = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 26,
  "2xl": 32,
} as const;

export type IconSizeKey = keyof typeof iconSize;

export const controlSize = {
  xs: 28,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
} as const;

export type ControlSizeKey = keyof typeof controlSize;

export const minTouchTarget = 44;
export const maxContentWidth = 1120;

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export const duration = {
  instant: 0,
  quick: 80,
  fast: 140,
  base: 220,
  slow: 320,
  slower: 480,
  slowest: 700,
} as const;

export type DurationKey = keyof typeof duration;

export const easing = {
  linear: "linear",
  /** Apple standard ease-in-out for native transitions. */
  standard: "cubic-bezier(0.32, 0.72, 0, 1)",
  /** Apple deceleration/entrance curve for elements arriving on screen. */
  entrance: "cubic-bezier(0, 0.55, 0.45, 1)",
  /** Apple acceleration/exit curve for elements leaving the screen. */
  exit: "cubic-bezier(0.55, 0.05, 0.55, 0.05)",
  /** Snappy feedback for press/hover micro-interactions. */
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  emphasize: "cubic-bezier(0.34, 1.3, 0.64, 1)",
} as const;

export type EasingKey = keyof typeof easing;

export const shadow = {
  1: "0 1px 2px 0 var(--a-color-shadow)",
  2: "0 2px 6px var(--a-color-shadow), 0 1px 2px var(--a-color-shadow)",
  3: "0 8px 20px var(--a-color-shadow), 0 2px 6px var(--a-color-shadow)",
  4: "0 16px 40px var(--a-color-shadow), 0 4px 12px var(--a-color-shadow)",
  overlay: "0 24px 64px var(--a-color-shadow), 0 8px 24px var(--a-color-shadow)",
} as const;

export type ShadowKey = keyof typeof shadow;

export const elevation = {
  flat: "none",
  raised: "var(--a-shadow-1)",
  floating: "var(--a-shadow-2)",
  prominent: "var(--a-shadow-3)",
  modal: "var(--a-shadow-overlay)",
} as const;

export type ElevationKey = keyof typeof elevation;

export const surfaceHierarchy = {
  canvas: { baseline: "var(--a-color-background)", elevation: "var(--elevation-flat)" },
  base: { baseline: "var(--a-color-surface)", elevation: "var(--elevation-flat)" },
  raised: {
    baseline: "var(--a-color-surfaceElevated)",
    elevation: "var(--elevation-raised)",
  },
  overlay: {
    baseline: "var(--a-color-surfaceOverlay)",
    elevation: "var(--elevation-prominent)",
  },
  inset: { baseline: "var(--a-color-surfaceInset)", elevation: "var(--elevation-flat)" },
} as const;

export type SurfaceKey = keyof typeof surfaceHierarchy;