import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { chance, type Rng } from "@/core/randomness";
import { MAX_ROWS, MIN_ROWS, multiplierFor } from "./config";
import type { PlinkoResult, PlinkoState } from "./types";

const CODE = "plinko:invalid-round";

type PlinkoOptions = { wager?: unknown; rows?: unknown } | undefined;

export class PlinkoEngine implements GameEngine<PlinkoState, PlinkoResult> {
  readonly gameId: GameId = "plinko";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): PlinkoState {
    const o = options as PlinkoOptions;
    if (!o) {
      throw new AppError(CODE, "wager and rows are required.");
    }
    if (o.wager === undefined || o.rows === undefined) {
      throw new AppError(CODE, "wager and rows are required.");
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
    if (typeof o.rows !== "number" || !Number.isInteger(o.rows)) {
      throw new AppError(CODE, "rows must be a whole number of peg rows.", {
        rows: o.rows,
      });
    }
    if (o.rows < MIN_ROWS || o.rows > MAX_ROWS) {
      throw new AppError(
        CODE,
        `rows must be between ${MIN_ROWS} and ${MAX_ROWS}.`,
        { rows: o.rows },
      );
    }
    const path = this.dropPath(o.rows);
    const slot = path.reduce(
      (count, bounce) => (bounce ? count + 1 : count),
      0,
    );
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      wager: o.wager,
      rows: o.rows,
      slot,
      path,
      finished: false,
      cashedOut: false,
    };
  }

  /**
   * The drop resolves at the moment it starts: the engine bounces the ball,
   * so the animation can never influence the settlement.
   */
  finishRound(_ctx: GameRoundContext, state: PlinkoState): PlinkoResult {
    const multiplier = multiplierFor(state.rows, state.slot);
    return {
      outcome: "win",
      slot: state.slot,
      rows: state.rows,
      path: state.path,
      multiplier,
      wager: state.wager,
      payout: Math.floor(state.wager * multiplier),
    };
  }

  private dropPath(rows: number): boolean[] {
    return Array.from({ length: rows }, () => chance(0.5, this.rng));
  }
}

export function createPlinkoEngine(rng: Rng): PlinkoEngine {
  return new PlinkoEngine(rng);
}