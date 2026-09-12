export interface Rng {
  /** Returns a float in [0, 1). */
  next(): number;
}

export interface SeededRngOptions {
  seed: number | string;
}

export function randomInt(min: number, max: number, rng: Rng): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError(`randomInt: invalid range [${min}, ${max}]`);
  }
  const span = max - min + 1;
  return min + Math.floor(rng.next() * span);
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) {
    throw new RangeError("pick: cannot pick from an empty collection");
  }
  const index = randomInt(0, items.length - 1, rng);
  const item = items[index];
  if (item === undefined) {
    throw new Error("pick: unexpected undefined item");
  }
  return item;
}

export function chance(probability: number, rng: Rng): boolean {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError(`chance: invalid probability ${probability}`);
  }
  return rng.next() < probability;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i, rng);
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) {
      throw new Error("shuffle: unexpected undefined item");
    }
    result[i] = b;
    result[j] = a;
  }
  return result;
}