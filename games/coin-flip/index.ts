export { COIN_FLIP_MS, COIN_FLIP_MULTIPLIER, CoinFlipEngine } from "./engine";
export type { CoinFlipOptions, CoinFlipOutcome, CoinFlipResult, CoinSide, CoinFlipState } from "./types";
export { COIN_SIDES, isCoinSide } from "./types";

import { CoinFlipEngine } from "./engine";
import type { Rng } from "@/core/randomness";

export function createCoinFlipEngine(rng: Rng): CoinFlipEngine {
  return new CoinFlipEngine(rng);
}