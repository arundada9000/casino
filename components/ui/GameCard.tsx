import Link from "next/link";
import type { CSSProperties } from "react";
import type { GameDefinition } from "@/core/game-engine";
import { gameIdentity } from "./game-identity";
import { ChevronRightIcon, LockIcon } from "./icons";

import styles from "./game-card.module.css";

export function GameCard({ game, href }: { game: GameDefinition; href?: string }) {
  const implemented = game.availability === "implemented";
  const { mark: Mark, tint } = gameIdentity(game.id);
  const label = `${game.name}, milestone ${game.milestone}`;
  const visual = { "--game-tint": tint } as CSSProperties;

  const inner = (
    <>
      <span className={styles.mark} aria-hidden="true">
        <Mark size={24} />
      </span>
      <span className={styles.body}>
        <h3 className={styles.name}>{game.name}</h3>
        <span className={styles.description}>{game.description}</span>
      </span>
      <span className={styles.goto} aria-hidden="true">
        {implemented ? <ChevronRightIcon size={18} /> : <LockIcon size={16} />}
      </span>
    </>
  );

  if (implemented && href) {
    return (
      <Link
        href={href}
        className={styles.card}
        style={visual}
        aria-label={`${game.name} - play`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      className={styles.card}
      style={visual}
      data-locked={true}
      aria-label={`${game.name} - coming soon`}
    >
      {inner}
    </article>
  );
}