import Link from "next/link";
import type { GameDefinition } from "@/core/game-engine";
import { LockIcon, PlayIcon, SparkleIcon } from "./icons";

import styles from "./game-card.module.css";

export function GameCard({ game, href }: { game: GameDefinition; href?: string }) {
  const implemented = game.availability === "implemented";
  const label = `${game.name}, milestone ${game.milestone}`;
  const inner = (
    <>
      <div className={styles.icon}>
        <SparkleIcon size={22} />
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{game.name}</h3>
        <p className={styles.description}>{game.description}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.pill} data-implemented={implemented || undefined}>
          {implemented ? (
            <>
              <PlayIcon size={12} /> Playable
            </>
          ) : (
            <>
              <LockIcon size={12} /> Milestone {game.milestone}
            </>
          )}
        </span>
      </div>
    </>
  );
  if (implemented && href) {
    return (
      <Link href={href} className={styles.card} data-implemented={true} aria-label={label}>
        {inner}
      </Link>
    );
  }
  return (
    <article className={styles.card} data-implemented={implemented || undefined} aria-label={label}>
      {inner}
    </article>
  );
}