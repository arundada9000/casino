import type { EconomyTransaction } from "@/core/economy";
import { GAME_REGISTRY, type GameId } from "@/core/game-engine";

export interface BalancePoint {
  timestamp: number;
  balance: number;
}

export interface GameStat {
  gameId: GameId;
  name: string;
  rounds: number;
  wagers: number;
  payouts: number;
  net: number;
  returnRate: number;
  largestWin: number;
}

export interface RoundResult {
  key: string;
  gameId?: GameId;
  change: number;
}

export interface Highlights {
  wagers: number;
  payouts: number;
  net: number;
  rounds: number;
  winRate: number;
  largestWin: number;
  largestLoss: number;
  bestRound: RoundResult | null;
  bestReturnGame: GameStat | null;
  bestGame: GameStat | null;
  worstGame: GameStat | null;
}

export interface ActivityStats {
  balanceSeries: BalancePoint[];
  highlights: Highlights;
  perGame: GameStat[];
}

interface Bucket {
  gameId: GameId;
  rounds: Set<string>;
  wagers: number;
  payouts: number;
  largestWin: number;
}

function gameName(gameId: GameId): string {
  const def = GAME_REGISTRY.find((entry) => entry.id === gameId);
  return def ? def.name : gameId;
}

/**
 * Derived, read-only statistics over the economy ledger. Everything here is
 * computed on demand from the audited transaction list, so insights can never
 * drift from the wallet.
 */
export function computeActivityStats(
  transactions: EconomyTransaction[],
  maxSeriesPoints: number = 32,
): ActivityStats {
  const buckets = new Map<GameId, Bucket>();
  const rounds = new Map<string, number>();
  let wagers = 0;
  let payouts = 0;
  let net = 0;
  let winCount = 0;
  let betCount = 0;
  let largestWin = 0;
  let largestLoss = 0;

  for (const txn of transactions) {
    net += txn.change;
    if (txn.type === "bet") {
      const amount = Math.abs(txn.change);
      wagers += amount;
      betCount += 1;
      if (txn.change < largestLoss) largestLoss = txn.change;
    } else if (txn.type === "win") {
      payouts += txn.change;
      winCount += 1;
      if (txn.change > largestWin) largestWin = txn.change;
    }

    const roundKey = roundIdentity(txn);
    if (roundKey) {
      rounds.set(roundKey, (rounds.get(roundKey) ?? 0) + txn.change);
    }

    const gameId = txn.gameId;
    if (!gameId) continue;
    let bucket = buckets.get(gameId);
    if (!bucket) {
      bucket = {
        gameId,
        rounds: new Set<string>(),
        wagers: 0,
        payouts: 0,
        largestWin: 0,
      };
      buckets.set(gameId, bucket);
    }
    const round = txn.roundId ?? txn.id;
    bucket.rounds.add(round);
    if (txn.type === "bet") bucket.wagers += Math.abs(txn.change);
    if (txn.type === "win") {
      bucket.payouts += txn.change;
      if (txn.change > bucket.largestWin) bucket.largestWin = txn.change;
    }
  }

  const perGame: GameStat[] = Array.from(buckets.values())
    .map((bucket) => ({
      gameId: bucket.gameId,
      name: gameName(bucket.gameId),
      rounds: bucket.rounds.size,
      wagers: bucket.wagers,
      payouts: bucket.payouts,
      net: bucket.payouts - bucket.wagers,
      returnRate: bucket.wagers > 0 ? bucket.payouts / bucket.wagers : 0,
      largestWin: bucket.largestWin,
    }))
    .sort((a, b) => b.net - a.net);

  let bestReturnGame: GameStat | null = null;
  for (const game of perGame) {
    if (game.wagers > 0 && game.returnRate > (bestReturnGame?.returnRate ?? -1)) {
      bestReturnGame = game;
    }
  }

  const positiveRounds = Array.from(rounds.entries())
    .filter((entry) => entry[1] > 0)
    .map(([key, change]) => {
      const source = transactions.find((txn) => roundIdentity(txn) === key);
      return { key, gameId: source?.gameId, change };
    })
    .sort((a, b) => b.change - a.change);

  const highlights: Highlights = {
    wagers,
    payouts,
    net,
    rounds: rounds.size,
    winRate: betCount > 0 ? winCount / betCount : 0,
    largestWin,
    largestLoss,
    bestRound: positiveRounds[0] ?? null,
    bestReturnGame,
    bestGame: perGame[0] ?? null,
    worstGame: perGame.length > 1 ? perGame[perGame.length - 1]! : null,
  };

  return {
    balanceSeries: buildBalanceSeries(transactions, maxSeriesPoints),
    highlights,
    perGame,
  };
}

function roundIdentity(txn: EconomyTransaction): string | null {
  if (txn.type !== "bet" && txn.type !== "win" && txn.type !== "refund") return null;
  if (txn.gameId && txn.roundId) return `${txn.gameId}:${txn.roundId}`;
  if (txn.gameId) return `${txn.gameId}:${txn.id}`;
  return null;
}

export function buildBalanceSeries(
  transactions: EconomyTransaction[],
  maxPoints: number = 32,
): BalancePoint[] {
  const chronological = Array.from(transactions).reverse();
  if (chronological.length === 0) return [];
  const step = Math.max(1, Math.ceil(chronological.length / maxPoints));
  const points: BalancePoint[] = [];
  for (let i = 0; i < chronological.length; i += step) {
    const txn = chronological[i]!;
    points.push({ timestamp: txn.timestamp, balance: txn.newBalance });
  }
  const newest = chronological[chronological.length - 1]!;
  if (points[points.length - 1]?.timestamp !== newest.timestamp) {
    points.push({ timestamp: newest.timestamp, balance: newest.newBalance });
  }
  return points;
}

export function percent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}