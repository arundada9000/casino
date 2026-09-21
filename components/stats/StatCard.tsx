import type { ReactNode } from "react";

import styles from "./stat-card.module.css";

export type StatTone = "neutral" | "positive" | "negative";

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: StatTone;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.card} data-tone={tone}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
      {icon ? <span className={styles.icon}>{icon}</span> : null}
    </div>
  );
}

export function StatGrid({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={styles.grid}>{children}</div>;
}