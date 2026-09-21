/** Board difficulty presets: peg rows, and slots = rows + 1. */
export const ROW_OPTIONS: readonly number[] = [8, 10, 12, 16];

export const MIN_ROWS = 8;
export const MAX_ROWS = 16;

/** House advantage applied to the fair multiplier ladder. */
export const HOUSE_EDGE = 0.01;

export const MULTIPLIER_PRECISION = 100;

/**
 * Multipliers are capped for ledger safety (Crash shares this cap). The
 * ladders in use never reach it.
 */
export const MAX_MULTIPLIER = 1_000;

/**
 * The payout shape, indexed by distance from the centre slot. Weight is a
 * relative appeal, not a probability: the ladder is built by scaling the
 * shape so that the probability-weighted average of the slots settles on the
 * target return (1 - HOUSE_EDGE). The shape delivers a centre jackpot with its
 * rare outer-jackpot echoes; the dip around the centre is the honest price of
 * the frequent centre payout.
 */
export const SHAPE_WEIGHTS: readonly number[] = [
  3.5, 0.3, 0.2, 0.15, 0.49, 2.94, 9.82, 20, 40,
];

/** Integer binomial coefficient, exact for the small boards in use. */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const tail = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= tail; i += 1) {
    result = (result * (n - tail + i)) / i;
  }
  return Math.round(result);
}

/** The probability a fair-coin ball lands in `slot` of a `rows`-row board. */
export function slotProbability(rows: number, slot: number): number {
  return combinations(rows, slot) / 2 ** rows;
}

function shape(rows: number, slot: number): number {
  const centre = rows >> 1;
  const distance = Math.min(Math.abs(slot - centre), SHAPE_WEIGHTS.length - 1);
  const weight = SHAPE_WEIGHTS[distance];
  return weight === undefined ? 1 : weight;
}

/** Normalization constant for a board: the weighted average weight. */
export function shapeNormalizer(rows: number): number {
  let total = 0;
  for (let slot = 0; slot <= rows; slot += 1) {
    total += slotProbability(rows, slot) * shape(rows, slot);
  }
  return total;
}

/**
 * The payout multiplier for landing in `slot` of a `rows`-row board: the slot
 * shape scaled so the whole ladder returns the target edge, floored to two
 * decimals and capped at `MAX_MULTIPLIER`.
 */
export function multiplierFor(rows: number, slot: number): number {
  const fair = shape(rows, slot) / shapeNormalizer(rows);
  const edged = fair * (1 - HOUSE_EDGE);
  const floored =
    Math.floor(edged * MULTIPLIER_PRECISION + 1e-6) / MULTIPLIER_PRECISION;
  return Math.min(MAX_MULTIPLIER, floored);
}