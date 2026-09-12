import { COLOR_SLOTS, type Palette } from "./slots";
import {
  breakpoints,
  controlSize,
  duration,
  easing,
  elevation,
  font,
  iconSize,
  radius,
  shadow,
  space,
  type,
} from "./scale";

function staticCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(space)) {
    vars[`--a-space-${key}`] = `${value}px`;
  }

  const addFrom = (record: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(record)) {
      vars[`--a-${prefix}-${key}`] = String(value);
    }
  };
  const addPixels = (record: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(record)) {
      vars[`--a-${prefix}-${key}`] = `${value}px`;
    }
  };

  addFrom(font, "font");
  for (const [key, style] of Object.entries(type)) {
    vars[`--a-type-${key}`] = `${style.size}px`;
  }
  addPixels(radius, "radius");
  addFrom(shadow, "shadow");
  addFrom(elevation, "elevation");
  for (const [key, value] of Object.entries(duration)) {
    vars[`--a-duration-${key}`] = `${value}ms`;
  }
  addFrom(easing, "ease");
  addPixels(controlSize, "control");
  addPixels(iconSize, "icon");

  vars["--a-breakpoint-sm"] = `${breakpoints.sm}px`;
  vars["--a-breakpoint-md"] = `${breakpoints.md}px`;
  vars["--a-breakpoint-lg"] = `${breakpoints.lg}px`;
  vars["--a-breakpoint-xl"] = `${breakpoints.xl}px`;
  vars["--a-breakpoint-2xl"] = `${breakpoints["2xl"]}px`;

  return vars;
}

const STATIC_VARS = staticCssVariables();

function colorVariables(palette: Palette): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const slot of COLOR_SLOTS) {
    vars[`--a-color-${slot}`] = palette[slot];
  }
  return vars;
}

export function resolveCssVariables(palette: Palette): Record<string, string> {
  return { ...STATIC_VARS, ...colorVariables(palette) };
}

export function applyCssVariables(
  element: HTMLElement,
  palette: Palette,
): void {
  const vars = resolveCssVariables(palette);
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value);
  }
}

export function removeCssVariables(element: HTMLElement): void {
  for (const [name] of Object.entries(resolveCssVariables({} as Palette))) {
    element.style.removeProperty(name);
  }
}

export const cssVariableNames = Object.keys(resolveCssVariables({} as Palette));