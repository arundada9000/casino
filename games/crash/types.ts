export type CrashOutcome = "win" | "crash";

export interface CrashState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  /** The multiplier the bus will crash at, rounded to two decimals. */
  readonly crashPoint: number;
}

export interface CrashResult {
  readonly crashPoint: number;
  /** The multiplier the round settled at (cash-out value or crash point). */
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
  readonly outcome: CrashOutcome;
  readonly cashedOut: boolean;
}