"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListRow";
import { TransactionRow } from "@/components/activity/TransactionRow";
import {
  ChevronRightIcon,
  ClockIcon,
  GiftIcon,
  LogoIcon,
} from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { useSettingsStore } from "@/stores/settings";
import { useMounted } from "@/hooks/useMounted";
import { GAME_REGISTRY } from "@/core/game-engine";
import { INITIAL_ALLOCATION } from "@/core/economy";
import { recentTransactions } from "@/lib/ledger";
import { formatCredits } from "@/lib/format";

import styles from "./home.module.css";

const FEATURED_COUNT = 4;

export default function HomePage() {
  const router = useRouter();
  const mounted = useMounted();
  const balance = useEconomyStore((state) => state.balance);
  const transactions = useEconomyStore((state) => state.transactions);
  const onboardingDismissed = useSettingsStore((state) => state.onboardingDismissed);
  const profileName = useSettingsStore((state) => state.profileName);
  const setOnboardingDismissed = useSettingsStore(
    (state) => state.setOnboardingDismissed,
  );

  const greeting = useMemo(() => {
    if (!mounted) return "Welcome";
    const hour = new Date().getHours();
    const base = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = profileName.trim();
    return name ? `${base}, ${name}` : base;
  }, [mounted, profileName]);

  const settledRounds = useMemo(
    () => transactions.filter((transaction) => transaction.type === "bet").length,
    [transactions],
  );
  const netSinceStart = balance - INITIAL_ALLOCATION;
  const netLabel = `${netSinceStart < 0 ? "-" : "+"}${formatCredits(Math.abs(netSinceStart))}`;

  const recent = recentTransactions({ transactions }, 2);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>{greeting}</h1>
        <p className={styles.subtitle}>Ten games on the floor. One house to beat.</p>
      </header>

      {!onboardingDismissed && mounted ? (
        <section className={styles.onboard} aria-label="Tour starter">
          <span className={styles.onboardIcon}>
            <GiftIcon size={17} />
          </span>
          <p className={styles.onboardBody}>
            <strong>Your first 25,000 credits are on the house.</strong>
            <span>
              Start with the foundation floor and learn how the ledger works.
            </span>
          </p>
          <div className={styles.onboardActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/foundation")}
            >
              Begin
            </Button>
            <button
              type="button"
              className={styles.onboardDismiss}
              onClick={() => setOnboardingDismissed(true)}
            >
              Not now
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={styles.hero}
        onClick={() => router.push("/wallet")}
        aria-label="Open the house account ledger"
      >
        <span className={styles.watermark} aria-hidden="true">
          <LogoIcon size={112} />
        </span>
        <span className={styles.heroTop}>
          <span className={styles.heroLabel}>
            <span className={styles.heroLabelIcon}>
              <LogoIcon size={12} />
            </span>
            House account
          </span>
          <span className={styles.medallion} aria-hidden="true">
            <LogoIcon size={17} />
          </span>
        </span>
        <span className={styles.heroBalance}>
          <span className={styles.heroAmount}>{formatCredits(balance)}</span>
          <span className={styles.heroUnit}>credits</span>
        </span>
        <span className={styles.heroNote}>Fictional credits - simulation only</span>
        <span className={styles.heroMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>Rounds played</span>
            <span className={styles.metaValue}>{settledRounds}</span>
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>Net since opening</span>
            <span
              className={styles.metaValue}
              data-positive={netSinceStart > 0 || undefined}
            >
              {netLabel}
            </span>
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>Floor games</span>
            <span className={styles.metaValue}>{GAME_REGISTRY.length}</span>
          </span>
          <span className={styles.heroGoto} aria-hidden="true">
            <ChevronRightIcon size={18} />
          </span>
        </span>
      </button>

      <section className={styles.section} aria-label="Featured games">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Games</h2>
          <span className={styles.sectionCount}>
            {FEATURED_COUNT} of {GAME_REGISTRY.length}
          </span>
          <Button
            variant="ghost"
            size="md"
            className={styles.seeAll}
            onClick={() => router.push("/games")}
            icon={<ChevronRightIcon size={16} />}
          >
            See all
          </Button>
        </div>
        <div className={styles.grid}>
          {GAME_REGISTRY.slice(0, FEATURED_COUNT).map((game) => (
            <GameCard
              key={game.id}
              game={game}
              href={
                game.availability === "implemented"
                  ? `/play/${game.id}`
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Recent activity">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <Button
            variant="ghost"
            size="md"
            className={styles.seeAll}
            onClick={() => router.push("/activity")}
            icon={<ChevronRightIcon size={16} />}
          >
            See all
          </Button>
        </div>
        {recent.length > 0 ? (
          <ListGroup>
            {recent.map((txn) => (
              <TransactionRow key={txn.id} transaction={txn} />
            ))}
          </ListGroup>
        ) : (
          <EmptyState
            icon={<ClockIcon size={26} />}
            title="Nothing yet"
            message="Your bets, wins, and bonuses will appear here."
          />
        )}
      </section>
    </div>
  );
}