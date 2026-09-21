import type { ComponentType } from "react";
import type { EconomyTransaction } from "@/core/economy";
import type { TransactionType } from "@/core/economy";
import { formatCredits, formatDateTime } from "@/lib/format";
import { relativeTime, transactionLabel } from "@/lib/ledger";
import { ListRow } from "@/components/ui/ListRow";
import {
  BugIcon,
  GiftIcon,
  MinusIcon,
  RefreshIcon,
  SlidersIcon,
  SparkleIcon,
} from "@/components/ui/icons";

import styles from "./transaction-row.module.css";

const TYPE_ICONS: Record<TransactionType, ComponentType<{ size?: number }>> = {
  "initial-allocation": GiftIcon,
  "daily-bonus": GiftIcon,
  bet: MinusIcon,
  win: SparkleIcon,
  refund: RefreshIcon,
  reset: SlidersIcon,
  adjustment: SlidersIcon,
  debug: BugIcon,
};

export function TransactionRow({
  transaction,
  showTime = true,
}: {
  transaction: EconomyTransaction;
  showTime?: boolean;
}) {
  const Icon = TYPE_ICONS[transaction.type];
  const positive = transaction.change > 0;
  const subtitle = [
    transaction.note ?? (transaction.gameId ? transaction.gameId : undefined),
    showTime ? relativeTime(transaction.timestamp) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      icon={<Icon size={17} />}
      title={transactionLabel(transaction.type)}
      subtitle={subtitle || formatDateTime(transaction.timestamp)}
      trailing={
        <span className={styles.amount} data-positive={positive || undefined}>
          {formatCredits(transaction.change, { signed: true })}
        </span>
      }
    />
  );
}