import type { Card } from "@/games/blackjack";

export type HiLoPrediction = "higher" | "lower" | "equal";

export interface HiLoState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  /** The face-up card the next card is guessed against. */
  readonly topCard: Card;
  /** The hidden card revealed when the round settles. */
  readonly revealCard: Card;
  /** Set by `call()` before the round is finished. */
  readonly prediction: HiLoPrediction | null;
  readonly finished: boolean;
  readonly cashedOut: boolean;
}

export interface HiLoResult {
  readonly outcome: "win" | "loss";
  readonly prediction: HiLoPrediction;
  readonly topCard: Card;
  readonly revealCard: Card;
  /** 0 for a miss or a call that had no cards in its direction. */
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
}