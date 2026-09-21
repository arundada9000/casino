/** House advantage baked into every crash point. */
export const HOUSE_EDGE = 0.01;

/** Crash points are resolved to two decimals. */
export const MULTIPLIER_PRECISION = 100;

/** The highest multiplier a round will ever reach. */
export const MAX_MULTIPLIER = 1_000;

/** Exponential rise rate (multiplier E-folds per second) for presentation. */
export const RISE_RATE = 0.55;

export function roundMultiplier(value: number): number {
  return Math.floor(value * MULTIPLIER_PRECISION) / MULTIPLIER_PRECISION;
}

/**
 * The full crash curve, shared with the screen so the animated readout always
 * matches the engine's authority.
 */
export function multiplierAt(elapsedMs: number): number {
  return Math.max(1, Math.exp((RISE_RATE * elapsedMs) / 1000));
}