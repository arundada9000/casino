import { describe, expect, it } from "vitest";
import {
  createCryptoRng,
  createRng,
  createSeededRng,
  randomInt,
  pick,
  chance,
  shuffle,
} from "@/core/randomness";

describe("seeded RNG", () => {
  it("produces identical sequences for the same numeric seed", () => {
    const a = createRng({ seed: 42 });
    const b = createRng({ seed: 42 });
    for (let i = 0; i < 100; i += 1) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("matches mulberry32 directly", () => {
    const outer = createRng({ seed: 7 });
    const inner = createSeededRng(7);
    for (let i = 0; i < 50; i += 1) {
      expect(outer.next()).toBe(inner.next());
    }
  });

  it("is deterministic for string seeds", () => {
    const a = createRng({ seed: "milestone-2" });
    const b = createRng({ seed: "milestone-2" });
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    );
  });
});

describe("crypto RNG", () => {
  it("emits values in [0, 1) and is not constant", () => {
    const rng = createCryptoRng();
    const values = Array.from({ length: 100 }, () => rng.next());
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});

describe("utilities", () => {
  it("keeps randomInt within the inclusive range", () => {
    const rng = createRng({ seed: 99 });
    for (let i = 0; i < 1_000; i += 1) {
      const value = randomInt(1, 6, rng);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("rejects inverted ranges", () => {
    expect(() => randomInt(5, 1, createRng())).toThrow(RangeError);
  });

  it("picks only from the given collection", () => {
    const rng = createRng({ seed: 3 });
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(pick(items, rng));
    }
    expect(() => pick([], rng)).toThrow(RangeError);
  });

  it("applies chance exactly at the boundaries", () => {
    expect(chance(1, createRng())).toBe(true);
    expect(chance(0, createRng())).toBe(false);
  });

  it("shuffles into a permutation", () => {
    const rng = createRng({ seed: 5 });
    const source = [1, 2, 3, 4, 5, 6];
    const result = shuffle(source, rng);
    expect(result).toHaveLength(source.length);
    expect([...result].sort((a, b) => a - b)).toEqual(source);
  });
});