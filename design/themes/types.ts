export type ColorScheme = "light" | "dark";

export const THEME_IDS = [
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
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

export const SYSTEM_DARK_THEME: ThemeId = "slate";
export const SYSTEM_LIGHT_THEME: ThemeId = "cloud";