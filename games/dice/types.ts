export const DICE_PIPS = [1, 2, 3, 4, 5, 6] as const;
export type DiceValue = (typeof DICE_PIPS)[number];

export const DICE_TOTALS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;
export type DiceTotal = (typeof DICE_TOTALS)[number];

export function isDiceValue(value: unknown): value is DiceValue {
  return (
    typeof value === "number" &&
    (DICE_PIPS as readonly number[]).includes(value)
  );
}

export function isDiceTotal(value: unknown): value is DiceTotal {
  return (
    typeof value === "number" &&
    (DICE_TOTALS as readonly number[]).includes(value)
  );
}

export type DicePrediction = "under" | "over" | { readonly total: DiceTotal };

export function isDicePrediction(value: unknown): value is DicePrediction {
  if (value === "under" || value === "over") return true;
  if (typeof value === "object" && value !== null) {
    return isDiceTotal((value as { total?: unknown }).total);
  }
  return false;
}

export interface DiceState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
  readonly prediction: DicePrediction;
}

export type DiceOutcome = "win" | "loss";

export interface DiceResult {
  readonly die1: DiceValue;
  readonly die2: DiceValue;
  readonly total: DiceTotal;
  readonly prediction: DicePrediction;
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
  readonly outcome: DiceOutcome;
}