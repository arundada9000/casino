"use client";

import { useMemo } from "react";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import { TransactionRow } from "@/components/activity/TransactionRow";
import { StatCard, StatGrid } from "@/components/stats/StatCard";
import { GameGainChart } from "@/components/stats/GameGainChart";
import {
  ChartIcon,
  ClockIcon,
  MinusIcon,
  SparkleIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { groupByDay } from "@/lib/ledger";
import { computeActivityStats } from "@/lib/stats";
import { formatCredits } from "@/lib/format";
import { getGameDefinition } from "@/core/game-engine";

export default function ActivityPage() {
  const transactions = useEconomyStore((state) => state.transactions);
  const stats = useMemo(() => computeActivityStats(transactions), [transactions]);
  const days = useMemo(() => groupByDay(transactions), [transactions]);
  const { highlights, perGame } = stats;
  const hasGameActivity = highlights.rounds > 0;

  return (
    <div>
      <LargeTitle subtitle="Every credit movement, and what your play reveals.">
        Activity
      </LargeTitle>

      {days.length > 0 ? (
        <>
          {hasGameActivity ? (
            <>
              <StatGrid aria-label="Session summary">
                <StatCard label="Wagered" value={formatCredits(highlights.wagers)} />
                <StatCard
                  label="Won"
                  value={formatCredits(highlights.payouts)}
                  sub={`across ${highlights.rounds} round${highlights.rounds === 1 ? "" : "s"}`}
                  tone="positive"
                />
                <StatCard
                  label="Net"
                  value={formatCredits(highlights.net, { signed: true })}
                  sub={highlights.winRate > 0 ? `${percentText(highlights.winRate)} win rate` : undefined}
                  tone={highlights.net >= 0 ? "positive" : "negative"}
                />
                <StatCard label="Rounds" value={String(highlights.rounds)} />
                <StatCard
                  label="Biggest win"
                  value={`+${formatCredits(highlights.largestWin)}`}
                  tone={highlights.largestWin > 0 ? "positive" : "neutral"}
                />
                <StatCard
                  label="Biggest loss"
                  value={`−${formatCredits(Math.abs(highlights.largestLoss))}`}
                  tone={highlights.largestLoss < 0 ? "negative" : "neutral"}
                />
              </StatGrid>

              {perGame.length > 0 ? (
                <ListGroup
                  title="By game"
                  footer="Wallet change from each game. Bars split at zero: up is profit, down is loss."
                >
                  <li>
                    <GameGainChart games={perGame} />
                  </li>
                </ListGroup>
              ) : null}

              <ListGroup title="Highlights">
                {highlights.bestReturnGame ? (
                  <ListRow
                    icon={<TrophyIcon size={17} />}
                    title="Top return"
                    subtitle={`${highlights.bestReturnGame.name} pays back the most per credit wagered`}
                    trailing={
                      <SignedCredits value={highlights.bestReturnGame.returnRate} multiplier />
                    }
                  />
                ) : null}
                {highlights.bestGame ? (
                  <ListRow
                    icon={<ChartIcon size={17} />}
                    title="Most rewarding"
                    subtitle={highlights.bestGame.name}
                    trailing={
                      <SignedCredits value={highlights.bestGame.net} />
                    }
                  />
                ) : null}
                {highlights.worstGame ? (
                  <ListRow
                    icon={<MinusIcon size={17} />}
                    title="Needs work"
                    subtitle={highlights.worstGame.name}
                    trailing={
                      <SignedCredits value={highlights.worstGame.net} />
                    }
                  />
                ) : null}
                {highlights.bestRound ? (
                  <ListRow
                    icon={<SparkleIcon size={17} />}
                    title="Biggest winning round"
                    subtitle={
                      highlights.bestRound.gameId
                        ? `in ${getGameDefinition(highlights.bestRound.gameId).name}`
                        : undefined
                    }
                    trailing={<SignedCredits value={highlights.bestRound.change} />}
                  />
                ) : null}
              </ListGroup>
            </>
          ) : null}

          {days.map((day) => (
            <ListGroup key={day.key} title={day.label}>
              {day.items.map((txn) => (
                <TransactionRow key={txn.id} transaction={txn} showTime={false} />
              ))}
            </ListGroup>
          ))}
        </>
      ) : (
        <EmptyState
          icon={<ClockIcon size={26} />}
          title="No activity yet"
          message="Bets, wins, and bonuses will land here as you play."
        />
      )}
    </div>
  );
}

function percentText(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

function SignedCredits({
  value,
  multiplier,
}: {
  value: number;
  multiplier?: boolean;
}) {
  const positive = value > 0;
  const negative = value < 0;
  if (multiplier) {
    return (
      <span style={{ color: "var(--a-color-success)" }}>
        ×{value.toFixed(2)}
      </span>
    );
  }
  return (
    <span
      style={{
        color: positive
          ? "var(--a-color-success)"
          : negative
            ? "var(--a-color-danger)"
            : undefined,
      }}
    >
      {positive ? "+" : negative ? "−" : ""}
      {formatCredits(Math.abs(value))} cr
    </span>
  );
}