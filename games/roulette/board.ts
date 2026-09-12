import type { RouletteBet, RouletteBetKind, RouletteColor } from "./types";

export const ROULETTE_WHEEL = ["straight", "red", "black", "odd", "even", "low", "high", "dozen", "column"] as const;

export const ROULETTE_MULTIPLIERS: Record<RouletteBetKind, number> = {
  straight: 36,
  red: 2,
  black: 2,
  odd: 2,
  even: 2,
  low: 2,
  high: 2,
  dozen: 3,
  column: 3,
};

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const ZEROS = new Set([0]);

export function rouletteColor(number: number): RouletteColor {
  if (ZEROS.has(number)) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
}

export function dozenOf(number: number): 1 | 2 | 3 | null {
  if (number < 1 || number > 36) return null;
  return (Math.floor((number - 1) / 12) + 1) as 1 | 2 | 3;
}

export function columnOf(number: number): 1 | 2 | 3 | null {
  if (number < 1 || number > 36) return null;
  return ((((number - 1) % 3) + 1) as 1 | 2 | 3);
}

export function roulettePayout(bet: RouletteBet): number {
  return bet.wager * ROULETTE_MULTIPLIERS[bet.kind];
}

export function betMatches(bet: RouletteBet, number: number): boolean {
  switch (bet.kind) {
    case "straight":
      return number === bet.target;
    case "red":
      return rouletteColor(number) === "red";
    case "black":
      return rouletteColor(number) === "black";
    case "odd":
      return number >= 1 && number % 2 === 1;
    case "even":
      return number >= 1 && number % 2 === 0;
    case "low":
      return number >= 1 && number <= 18;
    case "high":
      return number >= 19 && number <= 36;
    case "dozen":
      return dozenOf(number) === bet.target;
    case "column":
      return columnOf(number) === bet.target;
  }
}

export function betZoneKey(bet: RouletteBet): string {
  return `${bet.kind}:${bet.target ?? ""}`;
}