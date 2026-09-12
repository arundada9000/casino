export const COLOR_SLOTS = [
  "background",
  "surface",
  "surfaceElevated",
  "surfaceOverlay",
  "surfaceInset",
  "surfacePressed",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textOnAccent",
  "border",
  "borderStrong",
  "divider",
  "accent",
  "accentHover",
  "accentPressed",
  "accentSoft",
  "accentSoftStrong",
  "success",
  "successBg",
  "danger",
  "dangerBg",
  "warning",
  "warningBg",
  "info",
  "infoBg",
  "focusRing",
  "shadowColor",
  "scrim",
  "skeletonFrom",
  "skeletonTo",
] as const;

export type ColorSlot = (typeof COLOR_SLOTS)[number];

export type Palette = Record<ColorSlot, string>;

export function isColorSlot(value: unknown): value is ColorSlot {
  return typeof value === "string" && (COLOR_SLOTS as readonly string[]).includes(value);
}