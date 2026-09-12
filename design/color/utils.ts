export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HexColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function parseHex(input: string): HexColor {
  const value = input.trim().toLowerCase();
  let hex = value.replace(/^#/, "");
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 255;

  if (hex.length === 6 || hex.length === 8) {
    const int = Number.parseInt(hex, 16);
    red = (int >> 16) & 0xff;
    green = (int >> 8) & 0xff;
    blue = int & 0xff;
    alpha = hex.length === 8 ? int & 0xff : 255;
  } else {
    throw new Error(`Unsupported color format: "${input}"`);
  }

  return { red, green, blue, alpha };
}

function toHexChannel(value: number): string {
  return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
}

export function toHex({ red, green, blue, alpha }: HexColor): string {
  const base = `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
  return alpha === 255 ? base : `${base}${toHexChannel(alpha)}`;
}

export function toRgba(color: string, alpha: number): string {
  const { red, green, blue } = parseHex(color);
  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
}

export function toRgbaTuple(color: string): Rgba {
  const { red, green, blue, alpha } = parseHex(color);
  return { r: red, g: green, b: blue, a: alpha / 255 };
}

export function fromRgbaTuple({ r, g, b, a }: Rgba): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

export function withAlpha(hex: string, alpha: number): string {
  return toHex({ ...parseHex(hex), alpha: Math.round(clamp(alpha, 0, 1) * 255) });
}

export function mix(hexA: string, hexB: string, weight: number): string {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const t = clamp(weight, 0, 1);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  return toHex({
    red: lerp(a.red, b.red),
    green: lerp(a.green, b.green),
    blue: lerp(a.blue, b.blue),
    alpha: lerp(a.alpha, b.alpha),
  });
}

function relativeLuminance(hex: string): number {
  const { red, green, blue } = parseHex(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

export function isConstrastCompliant(hexA: string, hexB: string, ratio = 4.5): boolean {
  return contrastRatio(hexA, hexB) >= ratio;
}

export function readableText(hexBackground: string): string {
  const { red, green, blue } = parseHex(hexBackground);
  const yiq = (red * 299 + green * 587 + blue * 114) / 1000;
  return yiq >= 128 ? "#1a1a1c" : "#ffffff";
}

export function blend(toward: string, from: string, amount: number): string {
  return mix(from, toward, amount);
}