import { createCryptoRng } from "./crypto";
import { createSeededRng } from "./seeded";
import type { Rng } from "./rng";

export interface CreateRngOptions {
  seed?: number | string;
}

/**
 * Production gameplay uses crypto-backed randomness. Providing `seed`
 * (development/testing only) produces a deterministic sequence.
 */
export function createRng(options: CreateRngOptions = {}): Rng {
  if (options.seed !== undefined) {
    return createSeededRng(options.seed);
  }
  return createCryptoRng();
}

export type { Rng } from "./rng";
export {
  randomInt,
  pick,
  chance,
  shuffle,
} from "./rng";
export { createSeededRng, mulberry32, xmur3 } from "./seeded";
export { createCryptoRng } from "./crypto";