import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { type Rng } from "@/core/randomness";
import { HOUSE_EDGE, MAX_MULTIPLIER, MULTIPLIER_PRECISION, roundMultiplier } from "./config";
import type { CrashOutcome, CrashResult, CrashState } from "./types";

const CODE = "crash:invalid-round";

type CrashOptions = { wager?: unknown } | undefined;

export class CrashEngine implements GameEngine<CrashState, CrashResult> {
  readonly gameId: GameId = "crash";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): CrashState {
    const o = options as CrashOptions;
    if (!o) {
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
      crashPoint: this.computeCrashPoint(),
    };
  }

  /** A round that runs out of chances always settles as a crash. */
  finishRound(_ctx: GameRoundContext, state: CrashState): CrashResult {
    return this.crashed(state);
  }

  /**
   * Cash out at a live multiplier. Only a multiplier strictly below the crash
   * point is honoured; at or past it the round settles as a crash.
   */
  cashOut(state: CrashState, multiplier: number): CrashResult {
    const m = roundMultiplier(multiplier);
    if (m >= state.crashPoint || m < 1) {
      return this.crashed(state);
    }
    const payout = Math.floor(state.wager * m);
    return {
      crashPoint: state.crashPoint,
      multiplier: m,
      wager: state.wager,
      payout,
      outcome: "win",
      cashedOut: true,
    };
  }

  /** The authoritative settle when the bus crashes. */
  crashed(state: CrashState): CrashResult {
    return {
      crashPoint: state.crashPoint,
      multiplier: state.crashPoint,
      wager: state.wager,
      payout: 0,
      outcome: "crash",
      cashedOut: false,
    };
  }

  /** Decides the crash point straight from the Rng (never the UI). */
  private computeCrashPoint(): number {
    const x = Math.max(this.rng.next(), 1e-9);
    const raw = (1 - HOUSE_EDGE) / x;
    const capped = Math.min(raw, MAX_MULTIPLIER);
    return Math.max(1, roundMultiplier(capped));
  }
}

export function createCrashEngine(rng: Rng): CrashEngine {
  return new CrashEngine(rng);
}