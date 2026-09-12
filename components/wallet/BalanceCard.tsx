import { formatCredits } from "@/lib/format";
import { WalletIcon } from "@/components/ui/icons";

import styles from "./balance-card.module.css";

export function BalanceCard({
  balance,
  subtitle,
  onPress,
}: {
  balance: number;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.card}
      data-pressable={onPress ? true : undefined}
      onClick={onPress}
      aria-label="Wallet balance"
    >
      <div className={styles.copy}>
        <p className={styles.label}>
          <span className={styles.icon}>
            <WalletIcon size={15} />
          </span>
          Virtual wallet
        </p>
        <p className={styles.balance}>
          <span className={styles.amount}>{formatCredits(balance)}</span>
          <span className={styles.unit}>credits</span>
        </p>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </button>
  );
}