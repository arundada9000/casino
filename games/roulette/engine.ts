import { AppError } from "@/core/error";
import { MAX_BET, MIN_BET, type GameEngine, type GameId, type GameRoundContext } from "@/core/game-engine";
import { randomInt, type Rng } from "@/core/randomness";
import {
  betMatches,
  ROULETTE_MULTIPLIERS,
  rouletteColor,
} from "./board";
import { MAX_ROUND_BETS, ROULETTE_NUMBERS } from "./config";
import type {
  RouletteBet,
  RouletteResult,
  RouletteState,
} from "./types";

export const ROULETTE_SPIN_MS = 4200;

const CODE = "roulette:invalid-round";

const DOZEN_TARGETS = new Set([1, 2, 3]);
const COLUMN_TARGETS = new Set([1, 2, 3]);

function assertBet(bet: RouletteBet, index: number): void {
  const where = `bet[${index}]`;
  if (typeof bet.wager !== "number" || !Number.isFinite(bet.wager) || !Number.isInteger(bet.wager)) {
    throw new AppError(CODE, `${where}: wager must be a whole number of credits.`, { wager: bet.wager });
  }
  if (bet.wager < MIN_BET || bet.wager > MAX_BET) {
    throw new AppError(CODE, `${where}: wager must be between ${MIN_BET} and ${MAX_BET} credits.`, { wager: bet.wager });
  }
  if (!(bet.kind in ROULETTE_MULTIPLIERS)) {
    throw new AppError(CODE, `${where}: unknown bet kind.`, { kind: bet.kind });
  }
  const needsNumber = bet.kind === "straight";
  if (needsNumber) {
    if (!Number.isInteger(bet.target)) {
      throw new AppError(CODE, `${where}: straight bets need a winning number.`, { target: bet.target });
    }
    if (bet.target === null || !ROULETTE_NUMBERS.includes(bet.target)) {
      throw new AppError(CODE, `${where}: number must be between 0 and 36.`, { target: bet.target });
    }
    return;
  }
  const needsGroup = bet.kind === "dozen" || bet.kind === "column";
  if (needsGroup) {
    const allowed = bet.kind === "dozen" ? DOZEN_TARGETS : COLUMN_TARGETS;
    if (bet.target === null || !allowed.has(bet.target)) {
      throw new AppError(CODE, `${where}: ${bet.kind} must target 1, 2, or 3.`, { target: bet.target });
    }
    return;
  }
  if (bet.target !== null) {
    throw new AppError(CODE, `${where}: ${bet.kind} bets take no target.`, { target: bet.target });
  }
}

function assertBets(bets: readonly RouletteBet[]): void {
  if (!Array.isArray(bets) || bets.length === 0) {
    throw new AppError(CODE, "Place at least one bet before spinning.");
  }
  if (bets.length > MAX_ROUND_BETS) {
    throw new AppError(CODE, `A round can hold at most ${MAX_ROUND_BETS} bets.`);
  }
  bets.forEach((bet, index) => assertBet(bet, index));
}

export class RouletteEngine implements GameEngine<RouletteState, RouletteResult> {
  readonly gameId: GameId = "roulette";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options: { bets: readonly RouletteBet[] }): RouletteState {
    assertBets(options.bets);
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      bets: options.bets,
      totalWager: options.bets.reduce((sum, bet) => sum + bet.wager, 0),
    };
  }

  finishRound(_ctx: GameRoundContext, state: RouletteState): RouletteResult {
    const number = randomInt(0, 36, this.rng);
    const bets = state.bets.map((bet) => {
      const paid = betMatches(bet, number);
      return { bet, paid, payout: paid ? bet.wager * ROULETTE_MULTIPLIERS[bet.kind] : 0 };
    });
    return {
      number,
      color: rouletteColor(number),
      bets,
      totalWager: state.totalWager,
      totalPayout: bets.reduce((sum, outcome) => sum + outcome.payout, 0),
    };
  }
}