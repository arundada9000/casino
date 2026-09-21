import type { GameStat } from "@/lib/stats";
import { formatCredits } from "@/lib/format";

import styles from "./game-gain-chart.module.css";

export function GameGainChart({ games }: { games: GameStat[] }) {
  const maxAbs = Math.max(1, ...games.map((game) => Math.abs(game.net)));

  return (
    <ol className={styles.list}>
      {games.map((game) => {
        const share = Math.abs(game.net) / maxAbs;
        const positive = game.net > 0;
        const negative = game.net < 0;
        const width = `${(share * 50).toFixed(2)}%`;
        return (
          <li key={game.gameId} className={styles.row}>
            <span className={styles.name} title={game.name}>
              {game.name}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.zero} />
              {game.net !== 0 ? (
                <span
                  className={styles.bar}
                  data-positive={positive || undefined}
                  data-negative={negative || undefined}
                  style={
                    positive
                      ? { left: "50%", width }
                      : { left: `${(50 - share * 50).toFixed(2)}%`, width }
                  }
                />
              ) : null}
            </span>
            <span
              className={styles.value}
              data-positive={positive || undefined}
              data-negative={negative || undefined}
            >
              {game.net > 0 ? "+" : game.net < 0 ? "−" : ""}
              {formatCredits(Math.abs(game.net))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}