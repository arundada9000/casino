"use client";

import { useMemo } from "react";
import { useTheme } from "@/design/themes/ThemeProvider";
import { useEconomyStore } from "@/stores/economy";
import { useMounted } from "@/hooks/useMounted";
import {
  GAME_REGISTRY,
  implementedGames,
} from "@/core/game-engine";
import { isPersistenceAvailable } from "@/core/persistence";
import { formatCredits } from "@/lib/format";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

import styles from "./foundation.module.css";

interface SubsystemRow {
  label: string;
  value: string;
}

export function FoundationScreen() {
  const mounted = useMounted();
  const { resolved } = useTheme();
  const balance = useEconomyStore((state) => state.balance);
  const transactionCount = useEconomyStore((state) => state.transactions.length);

  const rows = useMemo<SubsystemRow[]>(() => {
    const totalGames = GAME_REGISTRY.length;
    const implemented = implementedGames().length;
    return [
      {
        label: "Persistence",
        value: mounted
          ? isPersistenceAvailable()
            ? "local storage (versioned)"
            : "ephemeral"
          : "...",
      },
      {
        label: "Economy",
        value: mounted
          ? `${formatCredits(balance)} cr · ${transactionCount} recorded`
          : "loading...",
      },
      {
        label: "Themes",
        value: `${resolved.name} · ${resolved.colorScheme}`,
      },
      {
        label: "Game engines",
        value: `${totalGames} registered · ${implemented} implemented`,
      },
      { label: "Sound", value: "placeholder engine (wired in Milestone 1)" },
      { label: "Haptics", value: "web vibrate engine placeholder" },
    ];
  }, [mounted, balance, transactionCount, resolved]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Virtual entertainment · simulation only</p>
        <h1 className={styles.wordmark}>Aurelia</h1>
        <p className={styles.tagline}>Foundation build · Milestone 0</p>
      </header>

      <section className={styles.card} aria-label="System status">
        <h2 className={styles.cardTitle}>System status</h2>
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.label} className={styles.row}>
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowValue}>{row.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-label="Wallet">
        <h2 className={styles.cardTitle}>Virtual wallet</h2>
        <p className={styles.balance}>
          {mounted ? formatCredits(balance) : "-"}
          <span className={styles.balanceUnit}>credits</span>
        </p>
        <p className={styles.note}>
          Fictional credits only. No deposits, withdrawals, or real-world
          value of any kind.
        </p>
      </section>

      <section className={styles.card} aria-label="Appearance">
        <ThemeSelector />
      </section>
    </div>
  );
}