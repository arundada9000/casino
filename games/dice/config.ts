import type { DiceTotal } from "./types";

/** How many two-die combinations produce each total. */
export const WAYS: Record<DiceTotal, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

/** Which exact totals can be called and what they pay. */
export function exactMultiplier(total: DiceTotal): number {
  const ways = WAYS[total];
  return Math.floor((36 * 0.9) / ways);
}

/** Under and over seven pay even money. */
export const LOW_HIGH_MULTIPLIER = 2;