import type { Palette } from "@/design/tokens/slots";
import { buildPalette, type ThemeBase } from "./palette";
import {
  isThemeId,
  SYSTEM_DARK_THEME,
  SYSTEM_LIGHT_THEME,
  type ColorScheme,
  type ThemeId,
} from "./types";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  colorScheme: ColorScheme | "system";
  palette: Palette;
}

export interface ResolvedTheme {
  id: ThemeId;
  name: string;
  colorScheme: ColorScheme;
  palette: Palette;
}

export interface ConcreteThemeDefinition extends Omit<ThemeDefinition, "colorScheme"> {
  colorScheme: ColorScheme;
}

type ConcreteTheme = Omit<ThemeDefinition, "id" | "colorScheme"> & {
  id: ThemeId;
  colorScheme: ColorScheme;
};

const define = (base: ThemeBase): ConcreteTheme => ({
  id: base.id as ThemeId,
  name: base.name,
  colorScheme: base.colorScheme,
  palette: buildPalette(base),
});

const midnight = define({
  id: "midnight",
  name: "Midnight",
  colorScheme: "dark",
  background: "#0a0d13",
  surface: "#11151f",
  surfaceElevated: "#181d2a",
  surfaceInset: "#0d111a",
  text: "#e9ecf4",
  accent: "#d0a96f",
});

const obsidian = define({
  id: "obsidian",
  name: "Obsidian",
  colorScheme: "dark",
  background: "#0c0c0e",
  surface: "#16161a",
  surfaceElevated: "#1f1f25",
  surfaceInset: "#111114",
  text: "#ededf2",
  accent: "#c9cdd6",
});

const ivory = define({
  id: "ivory",
  name: "Ivory",
  colorScheme: "light",
  background: "#f2ece1",
  surface: "#fdfaf4",
  surfaceElevated: "#ffffff",
  surfaceInset: "#eae2d3",
  text: "#2b2620",
  accent: "#34674d",
  success: "#1c7a48",
  danger: "#b1453c",
  warning: "#9a6a1a",
  info: "#2c5f9e",
  shadow: "rgba(38, 26, 12, 0.16)",
  scrim: "rgba(30, 20, 12, 0.35)",
});

const crimson = define({
  id: "crimson",
  name: "Crimson",
  colorScheme: "dark",
  background: "#120a0d",
  surface: "#1b1015",
  surfaceElevated: "#261821",
  surfaceInset: "#160d12",
  text: "#f5e9eb",
  accent: "#cf5a5a",
});

const emerald = define({
  id: "emerald",
  name: "Emerald",
  colorScheme: "dark",
  background: "#081210",
  surface: "#0e1d18",
  surfaceElevated: "#162621",
  surfaceInset: "#0b1713",
  text: "#e6f2ec",
  accent: "#3ec07a",
});

const sapphire = define({
  id: "sapphire",
  name: "Sapphire",
  colorScheme: "dark",
  background: "#0a0f1a",
  surface: "#0f1726",
  surfaceElevated: "#18233a",
  surfaceInset: "#0c1320",
  text: "#e7edf7",
  accent: "#5f8fe0",
});

const violet = define({
  id: "violet",
  name: "Violet",
  colorScheme: "dark",
  background: "#110b1c",
  surface: "#1a1128",
  surfaceElevated: "#251838",
  surfaceInset: "#150d22",
  text: "#efeafc",
  accent: "#a585f2",
});

const sepia = define({
  id: "sepia",
  name: "Sepia",
  colorScheme: "light",
  background: "#efe6d2",
  surface: "#faf4e4",
  surfaceElevated: "#fffdf6",
  surfaceInset: "#e7dcc2",
  text: "#3a3126",
  accent: "#94592a",
  success: "#4c6f2d",
  danger: "#a4532c",
  warning: "#8f6418",
  info: "#4a5f86",
  shadow: "rgba(40, 26, 10, 0.18)",
  scrim: "rgba(40, 26, 10, 0.38)",
});

const slate = define({
  id: "slate",
  name: "Slate",
  colorScheme: "dark",
  background: "#000000",
  surface: "#1c1c1e",
  surfaceElevated: "#2c2c2e",
  surfaceInset: "#111114",
  text: "#ffffff",
  accent: "#0a84ff",
  success: "#30d158",
  danger: "#ff453a",
  warning: "#ffd60a",
  info: "#64d2ff",
  shadow: "rgba(0, 0, 0, 0.5)",
  scrim: "rgba(0, 0, 0, 0.5)",
});

const cloud = define({
  id: "cloud",
  name: "Cloud",
  colorScheme: "light",
  background: "#f2f2f7",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceInset: "#e5e5ea",
  text: "#1c1c1e",
  accent: "#007aff",
  success: "#34c759",
  danger: "#ff3b30",
  warning: "#9a6a1a",
  info: "#5856d6",
  shadow: "rgba(0, 0, 0, 0.12)",
  scrim: "rgba(0, 0, 0, 0.45)",
});

const DEFINED: Record<Exclude<ThemeId, "system">, ConcreteThemeDefinition> = {
  midnight,
  obsidian,
  ivory,
  crimson,
  emerald,
  sapphire,
  violet,
  sepia,
  slate,
  cloud,
};

export const THEMES: ThemeId[] = [
  "system",
  "midnight",
  "obsidian",
  "ivory",
  "crimson",
  "emerald",
  "sapphire",
  "violet",
  "sepia",
  "slate",
  "cloud",
];

export function getConcreteTheme(
  id: Exclude<ThemeId, "system">,
): ConcreteThemeDefinition {
  return DEFINED[id];
}

export function resolveTheme(
  themeId: ThemeId,
  prefersDark: boolean,
): ResolvedTheme {
  if (!isThemeId(themeId)) {
    return resolveTheme(SYSTEM_DARK_THEME, prefersDark);
  }
  if (themeId === "system") {
    const id = prefersDark ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME;
    return resolveTheme(id, prefersDark);
  }
  const def = DEFINED[themeId];
  return {
    id: def.id,
    name: def.name,
    colorScheme: def.colorScheme,
    palette: def.palette,
  };
}

export function themeLabel(themeId: ThemeId): string {
  if (themeId === "system") return "System";
  return DEFINED[themeId].name;
}

export { isThemeId, SYSTEM_DARK_THEME, SYSTEM_LIGHT_THEME };
export type { ThemeId, ColorScheme } from "./types";