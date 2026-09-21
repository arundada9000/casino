import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { randomInt, type Rng } from "@/core/randomness";
import { WHEEL_SEGMENTS, WHEEL_TOTAL_WEIGHT } from "./config";
import type { WheelResult, WheelState } from "./types";

const CODE = "wheel:invalid-round";

type WheelOptions = { wager?: unknown } | undefined;

export class WheelEngine implements GameEngine<WheelState, WheelResult> {
  readonly gameId: GameId = "wheel";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): WheelState {
    const o = options as WheelOptions;
    if (!o) {
      throw new AppError(CODE, "wager is required.");
    }
    if (o.wager === undefined) {
      throw new AppError(CODE, "wager is required.");
    }
    if (typeof o.wager !== "number" || !Number.isInteger(o.wager)) {
      throw new AppError(CODE, "wager must be a whole number of credits.", {
        wager: o.wager,
      });
    }
    if (o.wager < MIN_BET || o.wager > MAX_BET) {
      throw new AppError(
        CODE,
        `wager must be between ${MIN_BET} and ${MAX_BET} credits.`,
        { wager: o.wager },
      );
    }
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      wager: o.wager,
      segment: this.drawSegment(),
      finished: false,
      cashedOut: false,
    };
  }

  /**
   * The wheel stop is drawn at spin time, so the animation can never change
   * the outcome.
   */
  finishRound(_ctx: GameRoundContext, state: WheelState): WheelResult {
    const segment = WHEEL_SEGMENTS[state.segment];
    if (segment === undefined) {
      throw new AppError(CODE, "segment is out of range.", {
        segment: state.segment,
      });
    }
    const multiplier = segment.multiplier;
    return {
      outcome: multiplier > 0 ? "win" : "zero",
      segment: state.segment,
      multiplier,
      wager: state.wager,
      payout: Math.floor(state.wager * multiplier),
    };
  }

  private drawSegment(): number {
    const units = randomInt(0, WHEEL_TOTAL_WEIGHT - 1, this.rng);
    let cursor = 0;
    for (let index = 0; index < WHEEL_SEGMENTS.length; index += 1) {
      cursor += WHEEL_SEGMENTS[index]?.weight ?? 0;
      if (units < cursor) return index;
    }
    return WHEEL_SEGMENTS.length - 1;
  }
}

export function createWheelEngine(rng: Rng): WheelEngine {
  return new WheelEngine(rng);
}