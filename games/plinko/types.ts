export interface PlinkoState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  /** Peg rows the ball bounces down, also the board difficulty dial. */
  readonly rows: number;
  /** Landing slot (0..rows), resolved by the engine at round start. */
  readonly slot: number;
  /** One bounce per peg row; true bounces right, false bounces left. */
  readonly path: readonly boolean[];
  readonly finished: boolean;
  readonly cashedOut: boolean;
}

export interface PlinkoResult {
  readonly outcome: "win";
  /** Landing slot (0..rows). */
  readonly slot: number;
  readonly rows: number;
  readonly path: readonly boolean[];
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
}