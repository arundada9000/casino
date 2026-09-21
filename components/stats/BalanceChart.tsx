import { useId } from "react";
import type { BalancePoint } from "@/lib/stats";

import styles from "./balance-chart.module.css";

const W = 100;
const H = 40;
const PAD = 3;

export function BalanceChart({
  points,
  ariaLabel,
}: {
  points: BalancePoint[];
  ariaLabel?: string;
}) {
  const gradientId = useId();
  if (points.length === 0) {
    return (
      <div
        className={styles.empty}
        role="img"
        aria-label={ariaLabel ?? "Balance history is empty"}
      />
    );
  }

  const values = points.map((point) => point.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * W;
    const y = H - PAD - ((point.balance - min) / span) * (H - PAD * 2);
    return { x, y };
  });

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = coords[coords.length - 1]!;

  return (
    <div className={styles.frame} role="img" aria-label={ariaLabel ?? "Balance history"}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.chart}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--a-color-accent, #d0a96f)", stopOpacity: 0.32 }} />
            <stop offset="100%" style={{ stopColor: "var(--a-color-accent, #d0a96f)", stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} className={styles.area} />
        <path d={line} pathLength={1} className={styles.line} />
        <circle cx={last.x} cy={last.y} r="1.6" className={styles.dot} />
      </svg>
    </div>
  );
}