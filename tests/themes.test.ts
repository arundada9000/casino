import { describe, expect, it } from "vitest";
import {
  THEMES,
  getConcreteTheme,
  resolveTheme,
  themeLabel,
} from "@/design/themes/theme";
import { COLOR_SLOTS, resolveCssVariables } from "@/design/tokens";
import { contrastRatio, isConstrastCompliant } from "@/design/color/utils";
import type { ThemeId } from "@/design/themes/types";

describe("theme catalogue", () => {
  it("exposes every planned theme id", () => {
    const expected = [
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
    ] satisfies ThemeId[];
    expect(THEMES).toEqual(expected);
  });

  it("gives each concrete theme a complete palette", () => {
    for (const id of THEMES.filter((t) => t !== "system")) {
      const theme = getConcreteTheme(id);
      expect(theme.palette).toBeDefined();
      for (const slot of COLOR_SLOTS) {
        expect(theme.palette[slot], `${id}.${slot}`).toBeTypeOf("string");
      }
    }
  });
});

describe("resolveTheme", () => {
  it("maps system to slate on dark preference and cloud on light", () => {
    expect(resolveTheme("system", true).id).toBe("slate");
    expect(resolveTheme("system", false).id).toBe("cloud");
  });

  it("keeps concrete themes regardless of preference", () => {
    expect(resolveTheme("midnight", true).colorScheme).toBe("dark");
    expect(resolveTheme("ivory", false).colorScheme).toBe("light");
  });

  it("falls back to a safe theme for unknown ids", () => {
    const result = resolveTheme("nope" as ThemeId, true);
    expect(COLOR_SLOTS.every((s) => typeof result.palette[s] === "string")).toBe(true);
  });

  it("labels system and concrete themes", () => {
    expect(themeLabel("system")).toBe("System");
    expect(themeLabel("obsidian")).toBe("Obsidian");
  });
});

describe("css variable generation", () => {
  it("emits color and scale variables from a palette", () => {
    const palette = getConcreteTheme("midnight").palette;
    const vars = resolveCssVariables(palette);
    expect(vars["--a-color-background"]).toBe(palette.background);
    expect(vars["--a-color-accent"]).toBe(palette.accent);
    expect(vars["--a-space-lg"]).toBe("16px");
    expect(vars["--a-duration-fast"]).toBe("140ms");
    expect(vars["--a-radius-lg"]).toBe("16px");
  });
});

describe("accessible contrast", () => {
  it("keeps primary text readable on each theme's background", () => {
    for (const id of THEMES.filter((t) => t !== "system")) {
      const palette = getConcreteTheme(id).palette;
      expect(contrastRatio(palette.textPrimary, palette.background)).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps accent text readable on each theme's accent", () => {
    for (const id of THEMES.filter((t) => t !== "system")) {
      const palette = getConcreteTheme(id).palette;
      expect(
        isConstrastCompliant(palette.textOnAccent, palette.accent, 3),
        `${id} accent`,
      ).toBe(true);
    }
  });
});