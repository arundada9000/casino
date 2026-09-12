import { AppError } from "@/core/error";
import { MAX_BET, MIN_BET, type GameEngine, type GameId, type GameRoundContext } from "@/core/game-engine";
import type { Rng } from "@/core/randomness";
import type {
  CoinFlipOptions,
  CoinFlipOutcome,
  CoinFlipResult,
  CoinSide,
  CoinFlipState,
} from "./types";
import { isCoinSide } from "./types";

export const COIN_FLIP_MULTIPLIER = 2;

/** Authoritative result is decided instantly; this is the animation length. */
export const COIN_FLIP_MS = 900;

const CODE = "coin-flip:invalid-round";

export class CoinFlipEngine implements GameEngine<CoinFlipState, CoinFlipResult> {
  readonly gameId: GameId = "coin-flip";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options: CoinFlipOptions): CoinFlipState {
    const { wager, picked } = options;
    if (!isCoinSide(picked)) {
      throw new AppError(CODE, "Pick a side (heads or tails) before flipping.", { picked });
    }
    if (typeof wager !== "number" || !Number.isFinite(wager) || !Number.isInteger(wager)) {
      throw new AppError(CODE, "Wager must be a whole number of credits.", { wager });
    }
    if (wager < MIN_BET || wager > MAX_BET) {
      throw new AppError(
        CODE,
        `Wager must be between ${MIN_BET} and ${MAX_BET} credits.`,
        { wager },
      );
    }
    return {
      roundId: ctx.roundId,
      wager,
      picked,
      startedAt: ctx.startedAt,
    };
  }

  finishRound(_ctx: GameRoundContext, state: CoinFlipState): CoinFlipResult {
    const side: CoinSide = this.rng.next() < 0.5 ? "heads" : "tails";
    const outcome: CoinFlipOutcome = side === state.picked ? "win" : "loss";
    const payout = outcome === "win" ? state.wager * COIN_FLIP_MULTIPLIER : 0;
    return {
      side,
      outcome,
      wager: state.wager,
      multiplier: COIN_FLIP_MULTIPLIER,
      payout,
    };
  }
}