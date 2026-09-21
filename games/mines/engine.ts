import { AppError } from "@/core/error";
import {
  MAX_BET,
  MIN_BET,
  type GameEngine,
  type GameId,
  type GameRoundContext,
} from "@/core/game-engine";
import { shuffle, type Rng } from "@/core/randomness";
import {
  BOARD_TILES,
  MAX_MINES,
  MIN_MINES,
  multiplierFor,
} from "./config";
import type {
  MinesReveal,
  MinesResult,
  MinesState,
} from "./types";

const CODE = "mines:invalid-round";

type MinesOptions = { wager?: unknown; mines?: unknown } | undefined;

export class MinesEngine implements GameEngine<MinesState, MinesResult> {
  readonly gameId: GameId = "mines";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): MinesState {
    const o = options as MinesOptions;
    if (!o) {
      throw new AppError(CODE, "wager and mines are required.");
    }
    if (o.wager === undefined || o.mines === undefined) {
      throw new AppError(CODE, "wager and mines are required.");
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
    if (typeof o.mines !== "number" || !Number.isInteger(o.mines)) {
      throw new AppError(CODE, "mines must be a whole number of bombs.", {
        mines: o.mines,
      });
    }
    if (o.mines < MIN_MINES || o.mines > MAX_MINES) {
      throw new AppError(
        CODE,
        `mines must be between ${MIN_MINES} and ${MAX_MINES} on this board.`,
        { mines: o.mines },
      );
    }
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      wager: o.wager,
      mines: o.mines,
      bombCells: this.placeBombs(o.mines),
      revealed: [],
      finished: false,
      cashedOut: false,
    };
  }

  /** A round that stops mid-play settles how it left off. */
  finishRound(_ctx: GameRoundContext, state: MinesState): MinesResult {
    if (state.cashedOut) return this.cashOutResult(state);
    if (state.finished) return this.hitMine(state);
    throw new AppError(
      CODE,
      "reveal a tile or cash out to finish a mines round.",
    );
  }

  /** Reveals one tile. Safe cells extend the round; a bomb ends it. */
  reveal(state: MinesState, cell: number): MinesReveal {
    this.assertPlayable(state);
    if (!Number.isInteger(cell) || cell < 0 || cell >= BOARD_TILES) {
      throw new AppError(CODE, `tile must be within 0..${BOARD_TILES - 1}.`, {
        cell,
      });
    }
    if (state.revealed.includes(cell)) {
      throw new AppError(CODE, "tile is already revealed.", { cell });
    }
    if (state.bombCells.includes(cell)) {
      return {
        kind: "mine",
        result: this.hitMine({ ...state, finished: true }),
      };
    }
    const revealed = [...state.revealed, cell];
    const next: MinesState = { ...state, revealed };
    return {
      kind: "safe",
      state: next,
      multiplier: multiplierFor(BOARD_TILES, state.mines, revealed.length),
      boardCleared: revealed.length === BOARD_TILES - state.mines,
    };
  }

  /** Virtual cash-out: banks the current safe-reveal multiplier. */
  cashOut(state: MinesState): MinesResult {
    this.assertPlayable(state);
    if (state.revealed.length === 0) {
      throw new AppError(CODE, "cash out after revealing at least one tile.");
    }
    return this.cashOutResult(state);
  }

  private cashOutResult(state: MinesState): MinesResult {
    const multiplier = multiplierFor(
      BOARD_TILES,
      state.mines,
      state.revealed.length,
    );
    return {
      outcome: "win",
      multiplier,
      wager: state.wager,
      payout: Math.floor(state.wager * multiplier),
      revealed: state.revealed,
      bombCells: state.bombCells,
    };
  }

  /** True when a cell hides a bomb. */
  isBomb(state: MinesState, cell: number): boolean {
    this.assertPlayable(state);
    return state.bombCells.includes(cell);
  }

  private hitMine(state: MinesState): MinesResult {
    return {
      outcome: "mine",
      multiplier: 0,
      wager: state.wager,
      payout: 0,
      revealed: state.revealed,
      bombCells: state.bombCells,
    };
  }

  private assertPlayable(state: MinesState): void {
    if (state.finished) {
      throw new AppError(CODE, "round is already over.", { roundId: state.roundId });
    }
    if (state.cashedOut) {
      throw new AppError(CODE, "round was already cashed out.", { roundId: state.roundId });
    }
  }

  private placeBombs(mines: number): number[] {
    const tiles = Array.from({ length: BOARD_TILES }, (_, index) => index);
    return shuffle(tiles, this.rng)
      .slice(0, mines)
      .sort((a, b) => a - b);
  }
}

export function createMinesEngine(rng: Rng): MinesEngine {
  return new MinesEngine(rng);
}