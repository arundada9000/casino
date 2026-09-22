import type { ComponentType, ReactNode } from "react";
import type { GameId } from "@/core/game-engine";

export interface GameMarkProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function Mark({
  size = 24,
  className,
  strokeWidth = 1.8,
  children,
}: GameMarkProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const CoinMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Mark>
);

const RouletteMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4.2v2.6" />
    <path d="M12 4.2v2.6" transform="rotate(45 12 12)" />
    <path d="M12 4.2v2.6" transform="rotate(90 12 12)" />
    <path d="M12 4.2v2.6" transform="rotate(135 12 12)" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
  </Mark>
);

const BlackjackMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <path d="M12 5.4c2.5 3.1 5 4.7 5 7.6a5 5 0 0 1-10 0c0-2.9 2.5-4.5 5-7.6Z" />
    <path d="M12 18.7v2.3" />
    <path d="M9.5 21.3h5" />
  </Mark>
);

const SlotsMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="9.2" cy="14.2" r="2.7" fill="currentColor" stroke="none" />
    <circle cx="14.9" cy="12.3" r="2.5" fill="currentColor" stroke="none" />
    <path d="M12.3 9.4c.8-1.7 2.5-2.6 3.9-2.2" />
    <path d="M9.4 11.9c-.9-1.5-2.6-2-3.7-1.5" />
  </Mark>
);

const DiceMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
    <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
  </Mark>
);

const CrashMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <path d="M12 3.5 16.4 15.2H7.6Z" />
    <circle cx="12" cy="9.4" r="1" fill="currentColor" stroke="none" />
    <path d="M12 15.2V17.6M9.7 17.7 12 20l2.3-2.3" />
  </Mark>
);

const MinesMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="12" cy="13" r="4.8" />
    <path d="M12 5.4v2.6M12 18v2.6M4.4 13h2.6M17 13h2.6" />
    <path d="m6.5 7.5 1.9 1.9M15.6 16.6l1.9 1.9M17.5 7.5l-1.9 1.9M8.4 16.6l-1.9 1.9" />
    <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
  </Mark>
);

const PlinkoMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="12" cy="6.4" r="2.6" fill="currentColor" stroke="none" />
    <path d="M12 9.2c-2.8.6-4.3 2.7-4.6 5.4M12 9.2c2.8.6 4.3 2.7 4.6 5.4" />
    <circle cx="8.6" cy="16.2" r="1" />
    <circle cx="12" cy="17.6" r="1" />
    <circle cx="15.4" cy="16.2" r="1" />
  </Mark>
);

const WheelMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <circle cx="12" cy="12" r="7.6" />
    <path
      d="M12 4.4a7.6 7.6 0 0 1 6.2 3.2L12 12Z"
      fill="currentColor"
      stroke="currentColor"
    />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Mark>
);

const HiLoMark = (props: GameMarkProps) => (
  <Mark {...props}>
    <path d="M12 3.5v17" />
    <path d="m7.4 8 4.6-4.5L16.6 8" />
    <path d="m7.4 16 4.6 4.5L16.6 16" />
  </Mark>
);

export interface GameIdentity {
  mark: ComponentType<GameMarkProps>;
  tint: string;
}

export const GAME_IDENTITIES: Record<GameId, GameIdentity> = {
  "coin-flip": { mark: CoinMark, tint: "#e3bc6c" },
  roulette: { mark: RouletteMark, tint: "#df6b5d" },
  blackjack: { mark: BlackjackMark, tint: "#6f8fd6" },
  slots: { mark: SlotsMark, tint: "#dd6f9c" },
  dice: { mark: DiceMark, tint: "#9b7fd8" },
  crash: { mark: CrashMark, tint: "#dd9449" },
  mines: { mark: MinesMark, tint: "#4cc389" },
  plinko: { mark: PlinkoMark, tint: "#3fb9b4" },
  wheel: { mark: WheelMark, tint: "#c95fae" },
  "hi-lo": { mark: HiLoMark, tint: "#43a6d9" },
};

export function gameIdentity(gameId: GameId): GameIdentity {
  return GAME_IDENTITIES[gameId];
}