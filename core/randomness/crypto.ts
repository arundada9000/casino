import type { Rng } from "./rng";

function cryptoUint32(): number {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    const value = buffer[0];
    if (value !== undefined) return value >>> 0;
  }
  return Math.floor(Math.random() * 0x1_0000_0000);
}

/**
 * Cryptographically-strong RNG for gameplay. Falls back to Math.random only
 * in environments without a Web Crypto implementation.
 */
export function createCryptoRng(): Rng {
  return {
    next() {
      return cryptoUint32() / 4294967296;
    },
  };
}