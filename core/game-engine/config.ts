export const MIN_BET = 100;
export const MAX_BET = 100_000;

export const BET_PRESETS = [100, 500, 1_000, 5_000] as const;

export const BET_STEP = 100;

export function clampWager(wager: number): number {
  const rounded = BET_STEP * Math.round(wager / BET_STEP);
  return Math.min(MAX_BET, Math.max(MIN_BET, rounded));
}