export const COIN_SIDES = ["heads", "tails"] as const;

export type CoinSide = (typeof COIN_SIDES)[number];

export function isCoinSide(value: unknown): value is CoinSide {
  return typeof value === "string" && (COIN_SIDES as readonly string[]).includes(value);
}

export interface CoinFlipOptions {
  wager: number;
  picked: CoinSide;
}

export interface CoinFlipState {
  readonly roundId: string;
  readonly wager: number;
  readonly picked: CoinSide;
  readonly startedAt: number;
}

export type CoinFlipOutcome = "win" | "loss";

export interface CoinFlipResult {
  readonly side: CoinSide;
  readonly outcome: CoinFlipOutcome;
  readonly wager: number;
  readonly multiplier: number;
  /** Credits paid back on a win (stake plus winnings); zero on a loss. */
  readonly payout: number;
}