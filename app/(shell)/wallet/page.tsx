"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListRow";
import { TransactionRow } from "@/components/activity/TransactionRow";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { BalanceChart } from "@/components/stats/BalanceChart";
import { StatCard, StatGrid } from "@/components/stats/StatCard";
import { ClockIcon } from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { useMounted } from "@/hooks/useMounted";
import { formatCredits } from "@/lib/format";
import { recentTransactions } from "@/lib/ledger";
import { computeActivityStats } from "@/lib/stats";

import styles from "./wallet.module.css";

export default function WalletPage() {
  const router = useRouter();
  const mounted = useMounted();
  const balance = useEconomyStore((state) => state.balance);
  const transactions = useEconomyStore((state) => state.transactions);
  const stats = useMemo(() => computeActivityStats(transactions), [transactions]);
  const recent = useMemo(
    () => recentTransactions({ transactions }, 8),
    [transactions],
  );
  const hasGameActivity = stats.highlights.rounds > 0;

  const series = stats.balanceSeries;
  const range =
    series.length > 1
      ? `${formatCredits(series[0]!.balance)} → ${formatCredits(series[series.length - 1]!.balance)}`
      : undefined;

  return (
    <div>
      <LargeTitle subtitle="Fictional credits. No deposits, no withdrawals, no cash-out.">
        Wallet
      </LargeTitle>

      <BalanceCard
        balance={balance}
        subtitle={mounted ? `${formatCredits(balance)} credits in your vault` : undefined}
      />

      {series.length > 1 ? (
        <section className={styles.trend} aria-label="Balance trend">
          <div className={styles.trendHead}>
            <h2 className={styles.trendTitle}>Balance trend</h2>
            <p className={styles.trendRange}>{range}</p>
          </div>
          <BalanceChart
            points={series}
            ariaLabel={`Balance history from ${formatCredits(series[0]!.balance)} to ${formatCredits(series[series.length - 1]!.balance)} credits`}
          />
        </section>
      ) : null}

      {hasGameActivity ? (
        <StatGrid aria-label="Session totals">
          <StatCard label="Wagered" value={formatCredits(stats.highlights.wagers)} />
          <StatCard
            label="Won"
            value={formatCredits(stats.highlights.payouts)}
            tone="positive"
          />
          <StatCard
            label="Net"
            value={formatCredits(stats.highlights.net, { signed: true })}
            tone={stats.highlights.net >= 0 ? "positive" : "negative"}
          />
        </StatGrid>
      ) : null}

      {recent.length > 0 ? (
        <ListGroup title="Recent transactions" footer="Full history, charts, and insights live in Activity.">
          {recent.map((txn) => (
            <TransactionRow key={txn.id} transaction={txn} />
          ))}
        </ListGroup>
      ) : (
        <EmptyState
          icon={<ClockIcon size={26} />}
          title="No transactions yet"
          message="Bonuses and gameplay will move credits in and out of your wallet."
        />
      )}

      <Button variant="ghost" size="md" onClick={() => router.push("/activity")}>
        View full activity
      </Button>
    </div>
  );
}