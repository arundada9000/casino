export type RouletteColor = "red" | "black" | "green";

export type RouletteBetKind =
  | "straight"
  | "red"
  | "black"
  | "odd"
  | "even"
  | "low"
  | "high"
  | "dozen"
  | "column";

export interface RouletteBet {
  readonly id: string;
  readonly kind: RouletteBetKind;
  /** Winning number 0..36 for `straight`; 1|2|3 for `dozen`/`column`; null otherwise. */
  readonly target: number | null;
  readonly wager: number;
}

export interface RouletteOptions {
  bets: readonly RouletteBet[];
}

export interface RouletteState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly bets: readonly RouletteBet[];
  readonly totalWager: number;
}

export interface RouletteBetOutcome {
  readonly bet: RouletteBet;
  readonly paid: boolean;
  readonly payout: number;
}

export interface RouletteResult {
  readonly number: number;
  readonly color: RouletteColor;
  readonly bets: readonly RouletteBetOutcome[];
  readonly totalWager: number;
  readonly totalPayout: number;
}