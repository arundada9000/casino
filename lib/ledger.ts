import type {
  EconomyLedgerState,
  EconomyTransaction,
  TransactionType,
} from "@/core/economy";

export function transactionLabel(type: TransactionType): string {
  switch (type) {
    case "initial-allocation":
      return "Welcome bonus";
    case "daily-bonus":
      return "Daily bonus";
    case "bet":
      return "Bet placed";
    case "win":
      return "Win";
    case "refund":
      return "Refund";
    case "reset":
      return "Balance reset";
    case "adjustment":
      return "Adjustment";
    case "debug":
      return "Debug";
  }
}

export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(timestamp);
}

export interface LedgerTotals {
  totalBets: number;
  totalWins: number;
  net: number;
  count: number;
}

export function ledgerTotals(transactions: EconomyTransaction[]): LedgerTotals {
  let totalBets = 0;
  let totalWins = 0;
  let net = 0;
  for (const txn of transactions) {
    if (txn.type === "bet") totalBets += Math.abs(txn.change);
    if (txn.type === "win") totalWins += txn.change;
    net += txn.change;
  }
  return { totalBets, totalWins, net, count: transactions.length };
}

export function recentTransactions(
  state: Pick<EconomyLedgerState, "transactions">,
  limit: number,
): EconomyTransaction[] {
  return state.transactions.slice(0, limit);
}

export interface DayGroup {
  key: string;
  label: string;
  items: EconomyTransaction[];
}

export function groupByDay(transactions: EconomyTransaction[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const txn of transactions) {
    const day = new Date(txn.timestamp);
    day.setHours(0, 0, 0, 0);
    const key = String(day.getTime());
    let group = groups.get(key);
    if (!group) {
      group = { key, label: dayLabel(day), items: [] };
      groups.set(key, group);
    }
    group.items.push(txn);
  }
  return Array.from(groups.values());
}

function dayLabel(day: Date): string {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(day);
}