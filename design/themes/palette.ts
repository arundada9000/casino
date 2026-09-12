import type { ColorScheme } from "./types";
import type { Palette } from "@/design/tokens/slots";
import { mix, withAlpha, readableText } from "@/design/color/utils";

export interface ThemeBase {
  id: string;
  name: string;
  colorScheme: ColorScheme;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceInset: string;
  text: string;
  accent: string;
  success?: string;
  danger?: string;
  warning?: string;
  info?: string;
  shadow?: string;
  scrim?: string;
}

const DEFAULT_SUCCESS = "#4cc389";
const DEFAULT_DANGER = "#e2645c";
const DEFAULT_WARNING = "#dfad52";
const DEFAULT_INFO = "#6f9fd0";

const DARK_SHADOW = "rgba(0, 0, 0, 0.42)";
const DARK_SCRIM = "rgba(0, 0, 0, 0.55)";
const LIGHT_SHADOW = "rgba(38, 26, 12, 0.18)";
const LIGHT_SCRIM = "rgba(30, 20, 12, 0.36)";

export function buildPalette(base: ThemeBase): Palette {
  const isDark = base.colorScheme === "dark";
  const shadowColor = base.shadow ?? (isDark ? DARK_SHADOW : LIGHT_SHADOW);
  const scrim = base.scrim ?? (isDark ? DARK_SCRIM : LIGHT_SCRIM);
  const success = base.success ?? DEFAULT_SUCCESS;
  const danger = base.danger ?? DEFAULT_DANGER;
  const warning = base.warning ?? DEFAULT_WARNING;
  const info = base.info ?? DEFAULT_INFO;

  return {
    background: base.background,
    surface: base.surface,
    surfaceElevated: base.surfaceElevated,
    surfaceOverlay: base.surfaceElevated,
    surfaceInset: base.surfaceInset,
    surfacePressed: mix(base.surface, base.background, 0.45),
    textPrimary: base.text,
    textSecondary: withAlpha(base.text, 0.74),
    textMuted: withAlpha(base.text, 0.52),
    textOnAccent: readableText(base.accent),
    border: withAlpha(base.text, 0.16),
    borderStrong: withAlpha(base.text, 0.28),
    divider: withAlpha(base.text, 0.1),
    accent: base.accent,
    accentHover: mix(base.accent, base.surfaceElevated, 0.12),
    accentPressed: mix(base.accent, base.surfaceElevated, 0.3),
    accentSoft: withAlpha(base.accent, 0.14),
    accentSoftStrong: withAlpha(base.accent, 0.26),
    success,
    successBg: withAlpha(success, 0.15),
    danger,
    dangerBg: withAlpha(danger, 0.15),
    warning,
    warningBg: withAlpha(warning, 0.15),
    info,
    infoBg: withAlpha(info, 0.15),
    focusRing: withAlpha(base.accent, 0.55),
    shadowColor: shadowColor,
    scrim: scrim,
    skeletonFrom: withAlpha(base.text, 0.06),
    skeletonTo: withAlpha(base.text, 0.12),
  };
}