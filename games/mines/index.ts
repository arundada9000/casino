export { MinesEngine, createMinesEngine } from "./engine";
export {
  BOARD_SIZE,
  BOARD_TILES,
  HOUSE_EDGE,
  MAX_MINES,
  MIN_MINES,
  MINES_OPTIONS,
  MULTIPLIER_PRECISION,
  multiplierFor,
} from "./config";
export type {
  MinesOutcome,
  MinesReveal,
  MinesRevealMine,
  MinesRevealSafe,
  MinesResult,
  MinesState,
} from "./types";