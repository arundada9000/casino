import type { Card } from "./cards";

export interface BetHand {
  readonly cards: readonly Card[];
  readonly bet: number;
  readonly doubled: boolean;
  /** Split-off hand (only meaningful when the round was split). */
  readonly split: boolean;
  readonly done: boolean;
}

export interface BlackjackState {
  readonly roundId: string;
  readonly startedAt: number;
  /** Remaining unseen cards; the end of the array is the top of the shoe. */
  readonly shoe: readonly Card[];
  readonly dealer: readonly Card[];
  readonly hands: readonly BetHand[];
  readonly activeHand: number;
  /** Sum of every wager debited so far (deal, double, split). */
  readonly stake: number;
}

export type BlackjackOutcome = "win" | "loss" | "push";

export interface BlackjackResult {
  readonly dealer: readonly Card[];
  readonly hands: readonly BetHand[];
  readonly outcome: BlackjackOutcome;
  readonly blackjack: boolean;
  readonly stake: number;
  /** Credits to award (winning hands, including 3:2 naturals). */
  readonly winPayout: number;
  /** Credits to refund (pushed hands). */
  readonly pushRefund: number;
}