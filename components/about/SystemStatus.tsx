"use client";

import { useMemo } from "react";
import { useTheme } from "@/design/themes/ThemeProvider";
import { useEconomyStore } from "@/stores/economy";
import { useMounted } from "@/hooks/useMounted";
import { GAME_REGISTRY, implementedGames } from "@/core/game-engine";
import { isPersistenceAvailable } from "@/core/persistence";
import { formatCredits } from "@/lib/format";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import {
  GamesIcon,
  GearIcon,
  HapticsIcon,
  SoundIcon,
  SlidersIcon,
  WalletIcon,
} from "@/components/ui/icons";

export function SystemStatus() {
  const mounted = useMounted();
  const { resolved } = useTheme();
  const balance = useEconomyStore((state) => state.balance);
  const transactionCount = useEconomyStore((state) => state.transactions.length);

  const rows = useMemo(() => {
    const totalGames = GAME_REGISTRY.length;
    const implemented = implementedGames().length;
    return [
      {
        icon: <SlidersIcon size={17} />,
        title: "Persistence",
        value: mounted
          ? isPersistenceAvailable()
            ? "local storage (versioned)"
            : "ephemeral"
          : "loading...",
      },
      {
        icon: <WalletIcon size={17} />,
        title: "Economy",
        value:
          mounted && transactionCount > 0
            ? `${formatCredits(balance)} cr · ${transactionCount} recorded`
            : "idle",
      },
      {
        icon: <GearIcon size={17} />,
        title: "Themes",
        value: `${resolved.name} · ${resolved.colorScheme}`,
      },
      {
        icon: <GamesIcon size={17} />,
        title: "Game engines",
        value: `${totalGames} registered · ${implemented} implemented`,
      },
      {
        icon: <SoundIcon size={17} />,
        title: "Sound",
        value: "WebAudio engine",
      },
      {
        icon: <HapticsIcon size={17} />,
        title: "Haptics",
        value: "web vibrate engine",
      },
    ];
  }, [mounted, balance, transactionCount, resolved]);

  return (
    <ListGroup title="System status">
      {rows.map((row) => (
        <ListRow key={row.title} icon={row.icon} title={row.title} trailing={row.value} />
      ))}
    </ListGroup>
  );
}