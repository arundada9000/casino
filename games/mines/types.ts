export type MinesOutcome = "win" | "mine";

export interface MinesState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  readonly mines: number;
  /** Indices of tiles hiding bombs, decided by the engine at round start. */
  readonly bombCells: readonly number[];
  /** Indices of tiles revealed safe so far. */
  readonly revealed: readonly number[];
  readonly finished: boolean;
  readonly cashedOut: boolean;
}

export interface MinesResult {
  readonly outcome: MinesOutcome;
  /** Cash-out multiplier on a win, 0 on a mine. */
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
  readonly revealed: readonly number[];
  readonly bombCells: readonly number[];
}

export interface MinesRevealSafe {
  readonly kind: "safe";
  readonly state: MinesState;
  /** Cash-out multiplier available after this reveal. */
  readonly multiplier: number;
  /** Every safe tile has been found; the win is in hand if cashed out. */
  readonly boardCleared: boolean;
}

export interface MinesRevealMine {
  readonly kind: "mine";
  readonly result: MinesResult;
}

export type MinesReveal = MinesRevealSafe | MinesRevealMine;