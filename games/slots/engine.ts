import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import type { Rng } from "@/core/randomness";
import {
  PAYTABLE,
  REEL_WEIGHTS,
  SLOT_ROWS,
  SYMBOL_ORDER,
  TWO_CHERRY_MULTIPLIER,
} from "./config";
import type {
  SlotSymbol,
  SlotsOutcome,
  SlotsResult,
  SlotsState,
  WinningLine,
} from "./types";

const CODE = "slots:invalid-round";

export class SlotsEngine implements GameEngine<SlotsState, SlotsResult> {
  readonly gameId: GameId = "slots";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): SlotsState {
    const o = options as { wager?: unknown } | undefined;
    if (!o || typeof o.wager !== "number" || !Number.isInteger(o.wager)) {
      throw new AppError(CODE, "wager must be a whole number of credits.");
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
    };
  }

  /**
   * Spins five reels and resolves the middle payline. The grid is decided
   * here; the UI animation is pure presentation on top of these columns.
   */
  finishRound(_ctx: GameRoundContext, state: SlotsState): SlotsResult {
    const columns = this.spinGrid();
    const line = this.evaluate(columns);
    const payout = line ? state.wager * line.multiplier : 0;
    const outcome: SlotsOutcome = payout > 0 ? "win" : "loss";
    return {
      columns,
      lines: line ? [line] : [],
      symbol: line ? line.symbol : null,
      multiplier: line ? line.multiplier : 0,
      wager: state.wager,
      payout,
      outcome,
    };
  }

  /** Three independent symbol draws per reel, top to bottom. */
  private spinGrid(): readonly (readonly SlotSymbol[])[] {
    const columns: SlotSymbol[][] = [];
    for (let column = 0; column < 5; column += 1) {
      const reel: SlotSymbol[] = [];
      for (let row = 0; row < SLOT_ROWS; row += 1) {
        reel.push(this.pickSymbol());
      }
      columns.push(reel);
    }
    return columns;
  }

  /**
   * Longest run of equal symbols across the middle row, left to right.
   * Three or more of a kind pays according to the symbol; two cherries pay
   * even money.
   */
  evaluate(columns: readonly (readonly SlotSymbol[])[]): WinningLine | null {
    const middle: readonly SlotSymbol[] = columns.map(
      (reel) => reel[1] as SlotSymbol,
    );
    const symbol = middle[0];
    let matched = 1;
    for (let column = 1; column < middle.length; column += 1) {
      if (middle[column] !== symbol) break;
      matched += 1;
    }
    const runSymbol = symbol as SlotSymbol;
    const table = PAYTABLE[runSymbol];
    let multiplier = 0;
    let columnsHit: number[] = [];
    if (matched >= 5) {
      multiplier = table.five;
      columnsHit = [0, 1, 2, 3, 4];
    } else if (matched === 4) {
      multiplier = table.four;
      columnsHit = [0, 1, 2, 3];
    } else if (matched === 3) {
      multiplier = table.three;
      columnsHit = [0, 1, 2];
    } else if (matched === 2 && runSymbol === "cherry") {
      multiplier = TWO_CHERRY_MULTIPLIER;
      columnsHit = [0, 1];
    }
    if (multiplier === 0) return null;
    return {
      symbol: runSymbol,
      columns: columnsHit,
      matched,
      multiplier,
    };
  }

  private pickSymbol(): SlotSymbol {
    const total = SYMBOL_ORDER.reduce((sum, symbol) => {
      return sum + (REEL_WEIGHTS[symbol] ?? 0);
    }, 0);
    const hit = this.rng.next() * total;
    let acc = 0;
    for (const symbol of SYMBOL_ORDER) {
      acc += REEL_WEIGHTS[symbol] ?? 0;
      if (hit < acc) return symbol;
    }
    const last = SYMBOL_ORDER[SYMBOL_ORDER.length - 1];
    if (!last) {
      throw new AppError(CODE, "no reel symbols configured.");
    }
    return last;
  }
}

export function createSlotsEngine(rng: Rng): SlotsEngine {
  return new SlotsEngine(rng);
}