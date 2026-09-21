import type { SlotSymbol } from "./types";

export const SLOT_COLUMNS = 5;
export const SLOT_ROWS = 3;

/** Whole spin animation length, then the reels stagger to a stop. */
export const SLOT_SPIN_MS = 1500;
/** Extra delay per reel, left to right. */
export const SLOT_REEL_STAGGER_MS = 140;

/** Symbol weightings for every reel column (higher = more common). */
export const REEL_WEIGHTS: Record<SlotSymbol, number> = {
  cherry: 72,
  lemon: 50,
  orange: 38,
  grape: 26,
  bell: 14,
  diamond: 9,
  seven: 6,
};

export const SYMBOL_ORDER: readonly SlotSymbol[] = [
  "cherry",
  "lemon",
  "orange",
  "grape",
  "bell",
  "diamond",
  "seven",
];

/** Payout multipliers for left-to-right runs of the middle payline. */
export const PAYTABLE: Record<
  SlotSymbol,
  { readonly five: number; readonly four: number; readonly three: number }
> = {
  cherry: { five: 5, four: 2, three: 1 },
  lemon: { five: 6, four: 2, three: 1 },
  orange: { five: 8, four: 3, three: 1 },
  grape: { five: 10, four: 4, three: 2 },
  bell: { five: 15, four: 5, three: 2 },
  diamond: { five: 20, four: 6, three: 3 },
  seven: { five: 25, four: 8, three: 3 },
};

/** Two cherries on the payline pay the bet back even. */
export const TWO_CHERRY_MULTIPLIER = 1;