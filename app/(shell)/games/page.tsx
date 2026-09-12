import { LargeTitle } from "@/components/ui/LargeTitle";
import { GameCard } from "@/components/ui/GameCard";
import { GAME_REGISTRY } from "@/core/game-engine";

import styles from "./games.module.css";

export default function GamesPage() {
  return (
    <div>
      <LargeTitle subtitle="Ten casino games, each arriving with its milestone. Coin Flip is playable today.">
        Games
      </LargeTitle>
      <div className={styles.grid}>
        {GAME_REGISTRY.map((game) => (
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
    </div>
  );
}