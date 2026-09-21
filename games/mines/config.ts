/** The board is a fixed 5 x 5 grid. */
export const BOARD_SIZE = 5;
export const BOARD_TILES = BOARD_SIZE * BOARD_SIZE;

export const MIN_MINES = 1;
export const MAX_MINES = BOARD_TILES - 1;

/** Difficulty presets shown in the picker. */
export const MINES_OPTIONS: readonly number[] = [3, 5, 8, 10, 12, 15, 20];

/** House advantage applied to the fair multiplier ladder. */
export const HOUSE_EDGE = 0.01;

export const MULTIPLIER_PRECISION = 100;

/**
 * The cash-out multiplier after `reveals` safe picks on a board of `tiles`
 * squares hiding `mines` bombs: the inverse chance of every pick having been
 * safe, edged down and floored to two decimals.
 */
export function multiplierFor(
  tiles: number,
  mines: number,
  reveals: number,
): number {
  if (reveals === 0) return 1;
  let fair = 1;
  for (let i = 0; i < reveals; i += 1) {
    fair *= (tiles - i) / (tiles - mines - i);
  }
  const edged = fair * (1 - HOUSE_EDGE);
  return (
    Math.floor(edged * MULTIPLIER_PRECISION + 1e-6) / MULTIPLIER_PRECISION
  );
}