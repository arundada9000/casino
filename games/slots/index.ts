export {
  PAYTABLE,
  REEL_WEIGHTS,
  SLOT_COLUMNS,
  SLOT_REEL_STAGGER_MS,
  SLOT_ROWS,
  SLOT_SPIN_MS,
  SYMBOL_ORDER,
  TWO_CHERRY_MULTIPLIER,
} from "./config";
export { SlotsEngine, createSlotsEngine } from "./engine";
export { isSlotSymbol, SLOT_SYMBOLS } from "./types";
export type {
  SlotsOutcome,
  SlotsResult,
  SlotsState,
  SlotSymbol,
  WinningLine,
} from "./types";