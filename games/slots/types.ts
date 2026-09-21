export const SLOT_SYMBOLS = [
  "cherry",
  "lemon",
  "orange",
  "grape",
  "bell",
  "diamond",
  "seven",
] as const;

export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

export function isSlotSymbol(value: unknown): value is SlotSymbol {
  return (
    typeof value === "string" &&
    (SLOT_SYMBOLS as readonly string[]).includes(value)
  );
}

export interface SlotsState {
  readonly roundId: string;
  readonly startedAt: number;
  readonly wager: number;
}

export type SlotsOutcome = "win" | "loss";

export interface WinningLine {
  readonly symbol: SlotSymbol;
  /** Columns on the middle payline that hit, left to right. */
  readonly columns: readonly number[];
  readonly matched: number;
  readonly multiplier: number;
}

export interface SlotsResult {
  /** Five reels, three visible rows each (top to bottom). */
  readonly columns: readonly (readonly SlotSymbol[])[];
  readonly lines: readonly WinningLine[];
  readonly symbol: SlotSymbol | null;
  readonly multiplier: number;
  readonly wager: number;
  readonly payout: number;
  readonly outcome: SlotsOutcome;
}