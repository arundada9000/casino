import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { pick, type Rng } from "@/core/randomness";
import { exactMultiplier, LOW_HIGH_MULTIPLIER } from "./config";
import {
  isDicePrediction,
  type DiceOutcome,
  type DicePrediction,
  type DiceResult,
  type DiceState,
  type DiceTotal,
  type DiceValue,
} from "./types";

const CODE = "dice:invalid-round";

const DIE_FACES: readonly DiceValue[] = [1, 2, 3, 4, 5, 6];

export class DiceEngine implements GameEngine<DiceState, DiceResult> {
  readonly gameId: GameId = "dice";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): DiceState {
    const o = options as { wager?: unknown; prediction?: unknown } | undefined;
    if (!o) {
      throw new AppError(CODE, "wager and prediction are required.");
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
    if (!isDicePrediction(o.prediction)) {
      throw new AppError(CODE, "pick under, over, or an exact total.", {
        prediction: o.prediction,
      });
    }
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      wager: o.wager,
      prediction: o.prediction as DicePrediction,
    };
  }

  /** Two fair die rolls decide the round. */
  finishRound(_ctx: GameRoundContext, state: DiceState): DiceResult {
    const die1 = pick(DIE_FACES, this.rng);
    const die2 = pick(DIE_FACES, this.rng);
    const total = (die1 + die2) as DiceTotal;
    const wins = this.predictionWins(state.prediction, total);
    const multiplier = this.predictionMultiplier(state.prediction);
    const outcome: DiceOutcome = wins ? "win" : "loss";
    const payout = wins ? state.wager * multiplier : 0;
    return {
      die1,
      die2,
      total,
      prediction: state.prediction,
      multiplier,
      wager: state.wager,
      payout,
      outcome,
    };
  }

  private predictionWins(prediction: DicePrediction, total: DiceTotal): boolean {
    if (prediction === "under") return total <= 6;
    if (prediction === "over") return total >= 8;
    return prediction.total === total;
  }

  private predictionMultiplier(prediction: DicePrediction): number {
    if (prediction === "under" || prediction === "over") {
      return LOW_HIGH_MULTIPLIER;
    }
    return exactMultiplier(prediction.total);
  }
}

export function createDiceEngine(rng: Rng): DiceEngine {
  return new DiceEngine(rng);
}