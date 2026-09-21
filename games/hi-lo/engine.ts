import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { shuffle, type Rng } from "@/core/randomness";
import { DECK, type Card } from "@/games/blackjack";
import { RANK_VALUE, multiplierFor } from "./config";
import type { HiLoPrediction, HiLoResult, HiLoState } from "./types";

const CODE = "hi-lo:invalid-round";

type HiLoOptions = { wager?: unknown } | undefined;

export class HiLoEngine implements GameEngine<HiLoState, HiLoResult> {
  readonly gameId: GameId = "hi-lo";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): HiLoState {
    const o = options as HiLoOptions;
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
    const shoe = shuffle(DECK, this.rng);
    const topCard = shoe[0];
    const revealCard = shoe[1];
    if (topCard === undefined || revealCard === undefined) {
      throw new AppError(CODE, "the shoe ran dry.", { roundId: ctx.roundId });
    }
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      wager: o.wager,
      topCard,
      revealCard,
      prediction: null,
      finished: false,
      cashedOut: false,
    };
  }

  /** Commits the guess. The reveal card is fixed, so the call never loses value. */
  call(state: HiLoState, prediction: unknown): HiLoState {
    this.assertPlayable(state);
    if (!isPrediction(prediction)) {
      throw new AppError(CODE, "prediction must be higher, lower, or equal.", {
        prediction,
      });
    }
    if (state.prediction !== null) {
      throw new AppError(CODE, "prediction was already made on this round.", {
        roundId: state.roundId,
      });
    }
    return { ...state, prediction };
  }

  finishRound(_ctx: GameRoundContext, state: HiLoState): HiLoResult {
    if (state.prediction === null) {
      throw new AppError(
        CODE,
        "call higher, lower, or equal to finish a hi-lo round.",
      );
    }
    return this.settle(state);
  }

  /** True when the reveal card would pay out a prediction against the top card. */
  matches(prediction: HiLoPrediction, topCard: Card, revealCard: Card): boolean {
    const top = RANK_VALUE[topCard.rank] ?? 0;
    const reveal = RANK_VALUE[revealCard.rank] ?? 0;
    if (prediction === "higher") return reveal > top;
    if (prediction === "lower") return reveal < top;
    return reveal === top;
  }

  private settle(state: HiLoState): HiLoResult {
    const prediction = state.prediction as HiLoPrediction;
    const won = this.matches(prediction, state.topCard, state.revealCard);
    const multiplier = won
      ? multiplierFor(prediction, state.topCard.rank)
      : 0;
    return {
      outcome: won ? "win" : "loss",
      prediction,
      topCard: state.topCard,
      revealCard: state.revealCard,
      multiplier,
      wager: state.wager,
      payout: won ? Math.floor(state.wager * multiplier) : 0,
    };
  }

  private assertPlayable(state: HiLoState): void {
    if (state.finished) {
      throw new AppError(CODE, "round is already over.", { roundId: state.roundId });
    }
    if (state.cashedOut) {
      throw new AppError(CODE, "round was already cashed out.", { roundId: state.roundId });
    }
  }
}

function isPrediction(value: unknown): value is HiLoPrediction {
  return value === "higher" || value === "lower" || value === "equal";
}

export function createHiLoEngine(rng: Rng): HiLoEngine {
  return new HiLoEngine(rng);
}