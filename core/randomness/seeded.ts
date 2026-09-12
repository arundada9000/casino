import type { Rng } from "./rng";

/**
 * mulberry32: a compact, deterministic 32-bit PRNG. Used for seeded
 * development/testing so game logic can be reproduced exactly.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** xmur3 string hash: turns arbitrary strings into a 32-bit seed. */
export function xmur3(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function createSeededRng(seed: number | string): Rng {
  const numeric =
    typeof seed === "string" ? xmur3(seed) : (seed >>> 0) || 1;
  return mulberry32(numeric);
}