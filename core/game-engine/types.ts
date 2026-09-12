export const GAME_IDS = [
  "coin-flip",
  "roulette",
  "blackjack",
  "slots",
  "dice",
  "crash",
  "mines",
  "plinko",
  "wheel",
  "hi-lo",
] as const;

export type GameId = (typeof GAME_IDS)[number];

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && (GAME_IDS as readonly string[]).includes(value);
}

export type GameAvailability = "conceptual" | "implemented";

export interface GameDefinition {
  id: GameId;
  name: string;
  description: string;
  /** Milestone in which this game is scheduled to be built. */
  milestone: number;
  availability: GameAvailability;
}

/** Identifies a single play session of a game. */
export interface GameRoundContext {
  gameId: GameId;
  roundId: string;
  startedAt: number;
}

/**
 * Contract every concrete game engine must satisfy. Engines own the rules;
 * UI only renders what an engine reports.
 */
export interface GameEngine<S extends object, R extends object> {
  readonly gameId: GameId;
  readonly version: string;

  /** Begins a new round; returns the authoritative initial state. */
  beginRound(ctx: GameRoundContext, options?: unknown): S;

  /** Finishes the round and produces the authoritative result. */
  finishRound(ctx: GameRoundContext, state: S): R;

  /** Cancels a round without producing a result (e.g. user leaves mid-round). */
  cancelRound?(ctx: GameRoundContext, state: S): void;
}