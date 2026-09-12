export { ROULETTE_SPIN_MS, RouletteEngine } from "./engine";
export {
  betMatches,
  betZoneKey,
  columnOf,
  dozenOf,
  rouletteColor,
  roulettePayout,
  ROULETTE_MULTIPLIERS,
} from "./board";
export { MAX_ROUND_BETS, ROULETTE_NUMBERS } from "./config";
export type {
  RouletteBet,
  RouletteBetKind,
  RouletteBetOutcome,
  RouletteColor,
  RouletteOptions,
  RouletteResult,
  RouletteState,
} from "./types";

import { RouletteEngine } from "./engine";
import type { Rng } from "@/core/randomness";

export function createRouletteEngine(rng: Rng): RouletteEngine {
  return new RouletteEngine(rng);
}