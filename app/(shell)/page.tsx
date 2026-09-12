"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListRow";
import { TransactionRow } from "@/components/activity/TransactionRow";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { ChevronRightIcon, ClockIcon, GiftIcon } from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { useSettingsStore } from "@/stores/settings";
import { useMounted } from "@/hooks/useMounted";
import { GAME_REGISTRY } from "@/core/game-engine";
import { recentTransactions } from "@/lib/ledger";

import styles from "./home.module.css";

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

  const recent = recentTransactions({ transactions }, 3);

  return (
    <div>
      <LargeTitle subtitle="A premium fictional casino simulation">
        {greeting}
      </LargeTitle>

      {!onboardingDismissed && mounted ? (
        <section className={styles.welcome} aria-label="Welcome">
          <span className={styles.welcomeIcon}>
            <GiftIcon size={22} />
          </span>
          <div className={styles.welcomeBody}>
            <h2>Welcome to Aurelia</h2>
            <p>
              You started with 25,000 virtual credits. Everything here is
              fictional: no deposits, no withdrawals, no real money.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setOnboardingDismissed(true)}>
            Got it
          </Button>
        </section>
      ) : null}

      <div className={styles.section}>
        <BalanceCard
          balance={balance}
          subtitle="Fictional credits · simulation only"
          onPress={() => router.push("/wallet")}
        />
      </div>

      <section className={styles.section} aria-label="Featured games">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Games</h2>
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push("/games")}
            icon={<ChevronRightIcon size={18} />}
          >
            See all
          </Button>
        </div>
        <div className={styles.grid}>
          {GAME_REGISTRY.slice(0, 4).map((game) => (
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
          <h2 className={styles.sectionTitle}>Activity</h2>
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push("/activity")}
            icon={<ChevronRightIcon size={18} />}
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