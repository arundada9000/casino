import type { Rank } from "@/games/blackjack";
import type { HiLoPrediction } from "./types";

/** Point value of each rank, Ace high. */
export const RANK_VALUES: readonly (readonly [Rank, number])[] = [
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
  ["6", 6],
  ["7", 7],
  ["8", 8],
  ["9", 9],
  ["10", 10],
  ["J", 11],
  ["Q", 12],
  ["K", 13],
  ["A", 14],
] as const;

/** The rank magnitude used for higher/lower comparisons (e.g. Jack = 11). */
export const RANK_VALUE = Object.fromEntries(RANK_VALUES) as Record<Rank, number>;

export const HOUSE_EDGE = 0.01;

/** The number of cards left after the face-up top card is removed from one full deck. */
export const REMAINING = 51;

/**
 * The remaining cards strictly above a rank: four of every higher rank.
 * Reaches zero only for the Ace, so "higher" is unwinnable over an Ace.
 */
export function cardsAbove(rank: Rank): number {
  const value = RANK_VALUE[rank];
  let count = 0;
  for (const [, candidateValue] of RANK_VALUES) {
    if (candidateValue > value) count += 4;
  }
  return count;
}

/** The remaining cards strictly below a rank (zero only below a Two). */
export function cardsBelow(rank: Rank): number {
  const value = RANK_VALUE[rank];
  let count = 0;
  for (const [, candidateValue] of RANK_VALUES) {
    if (candidateValue < value) count += 4;
  }
  return count;
}

/** The three other cards sharing a rank (one of the four is the top card). */
export function cardsEqual(_rank: Rank): number {
  return 3;
}

/** The true number of remaining cards that would pay out a prediction. */
export function remainingCards(prediction: HiLoPrediction, rank: Rank): number {
  switch (prediction) {
    case "higher":
      return cardsAbove(rank);
    case "lower":
      return cardsBelow(rank);
    case "equal":
      return cardsEqual(rank);
  }
}

/**
 * Fair payout for a prediction, skimmed by the 1% house edge and floored to
 * the last cent so a winning bet always banks at least 1.05x and never a
 * fractional credit. A prediction with no cards in its direction pays 0.
 */
export function multiplierFor(
  prediction: HiLoPrediction,
  rank: Rank,
): number {
  const remaining = remainingCards(prediction, rank);
  if (remaining <= 0) return 0;
  const value = (REMAINING / remaining) * (1 - HOUSE_EDGE);
  return Math.floor(value * 100 + 1e-6) / 100;
}