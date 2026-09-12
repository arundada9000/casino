import type { GameDefinition, GameId } from "./types";

/**
 * The master catalogue of games. Every planned game exists here at the
 * architecture level, but nothing is playable until its milestone passes.
 */
export const GAME_REGISTRY: readonly GameDefinition[] = [
  {
    id: "coin-flip",
    name: "Coin Flip",
    description: "Call heads or tails.",
    milestone: 2,
    availability: "implemented",
  },
  {
    id: "roulette",
    name: "Roulette",
    description: "European roulette table.",
    milestone: 3,
    availability: "implemented",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    description: "Classic twenty-one against the dealer.",
    milestone: 4,
    availability: "implemented",
  },
  {
    id: "slots",
    name: "Slots",
    description: "Configurable reel slots.",
    milestone: 5,
    availability: "implemented",
  },
  {
    id: "dice",
    name: "Dice",
    description: "Predict the roll.",
    milestone: 6,
    availability: "implemented",
  },
  {
    id: "crash",
    name: "Crash",
    description: "Cash out before the multiplier crashes.",
    milestone: 7,
    availability: "implemented",
  },
  {
    id: "mines",
    name: "Mines",
    description: "Reveal safe tiles, avoid the mines.",
    milestone: 8,
    availability: "implemented",
  },
  {
    id: "plinko",
    name: "Plinko",
    description: "Drop the ball through a peg field.",
    milestone: 9,
    availability: "implemented",
  },
  {
    id: "wheel",
    name: "Wheel",
    description: "Spin a wheel of multipliers.",
    milestone: 10,
    availability: "implemented",
  },
  {
    id: "hi-lo",
    name: "Hi-Lo",
    description: "Guess higher or lower.",
    milestone: 10,
    availability: "implemented",
  },
];

export function getGameDefinition(gameId: GameId): GameDefinition {
  const def = GAME_REGISTRY.find((entry) => entry.id === gameId);
  if (!def) {
    throw new Error(`Unknown game id: ${String(gameId)}`);
  }
  return def;
}

export function isGameIdImplemented(gameId: GameId): boolean {
  return getGameDefinition(gameId).availability === "implemented";
}

export function implementedGames(): GameDefinition[] {
  return GAME_REGISTRY.filter((entry) => entry.availability === "implemented");
}