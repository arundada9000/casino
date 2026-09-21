import type { WheelSegment } from "./types";

/**
 * The wheel of multipliers. Four wedge types with weighted arcs; the engine
 * draws a stop by arc weight, so a wedge's probability is its share of the
 * total arc. The arc weights below are tuned so the probability-weighted
 * return is exactly 0.99 (a 1% house edge) with rounded, honest numbers.
 *
 * | multiplier | weight | probability | return contribution |
 * | ---------- | ------ | ----------- | ------------------- |
 * | 0          | 63     | 63%         | 0                   |
 * | 1          | 29     | 29%         | 0.29                |
 * | 5          | 6      | 6%          | 0.30                |
 * | 20         | 2      | 2%          | 0.40                |
 *
 * Total expected return: 0.99.
 */
export const WHEEL_SEGMENTS: readonly WheelSegment[] = [
  { multiplier: 0, weight: 63 },
  { multiplier: 1, weight: 29 },
  { multiplier: 5, weight: 6 },
  { multiplier: 20, weight: 2 },
];

export const HOUSE_EDGE = 0.01;

/** Sum of all wedge weights. */
export const WHEEL_TOTAL_WEIGHT: number = WHEEL_SEGMENTS.reduce(
  (sum, segment) => sum + segment.weight,
  0,
);

/**
 * The probability a fair draw lands on a given segment (share of the arc).
 */
export function segmentProbability(segmentIndex: number): number {
  const segment = WHEEL_SEGMENTS[segmentIndex];
  if (segment === undefined) return 0;
  return segment.weight / WHEEL_TOTAL_WEIGHT;
}

/** The probability-weighted multiplier payout of the whole table. */
export function expectedReturn(): number {
  let total = 0;
  for (let index = 0; index < WHEEL_SEGMENTS.length; index += 1) {
    total += segmentProbability(index) * (WHEEL_SEGMENTS[index]?.multiplier ?? 0);
  }
  return total;
}

/** Clockwise degrees from the top of the wheel to the start of a wedge. */
export function segmentStartAngle(segmentIndex: number): number {
  let weight = 0;
  for (let index = 0; index < segmentIndex; index += 1) {
    weight += WHEEL_SEGMENTS[index]?.weight ?? 0;
  }
  return (weight / WHEEL_TOTAL_WEIGHT) * 360;
}

/** Clockwise degrees from the top of the wheel to a wedge's centre. */
export function segmentCenterAngle(segmentIndex: number): number {
  const start = segmentStartAngle(segmentIndex);
  const arc = ((WHEEL_SEGMENTS[segmentIndex]?.weight ?? 0) / WHEEL_TOTAL_WEIGHT) * 360;
  return start + arc / 2;
}

/**
 * The rotation the wheel should settle at so the drawn wedge sits under the
 * top pointer, spun forward from the current rotation. The presentation layer
 * only animates towards this value; the wedge itself was already drawn by the
 * engine, so the spin can never change the outcome.
 */
export function spinRotation(
  fromAngle: number,
  segmentIndex: number,
  turns = 5,
): number {
  const current = ((fromAngle % 360) + 360) % 360;
  const desired = (360 - (segmentCenterAngle(segmentIndex) % 360)) % 360;
  const continuation = ((desired - current) % 360 + 360) % 360;
  return fromAngle + 360 * turns + continuation;
}