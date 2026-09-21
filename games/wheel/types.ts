export interface WheelSegment {
  /** Payout multiplier (`readonly` so the table stays immutable). */
  readonly multiplier: number;
  /** Arc weight in abstract units; bigger arc, likelier stop. */
  readonly weight: number;
}

export interface WheelState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  /** The segment index the wheel lands on, decided by the engine. */
  readonly segment: number;
  readonly finished: boolean;
  readonly cashedOut: boolean;
}

export interface WheelResult {
  readonly outcome: "win" | "zero";
  /** Index into the segment table the wheel stopped on. */
  readonly segment: number;
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
}