import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function Icon({
  size = 22,
  className,
  strokeWidth = 1.8,
  children,
}: IconProps & { children: ReactNode }) {
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

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.8 12 3.5l9 7.3" />
      <path d="M5.5 9.5V20.2a0.8 0.8 0 0 0 0.8 0.8h1.7v-5.4h7.9v5.4h1.8a0.8 0.8 0 0 0 0.8-0.8V9.5" />
    </Icon>
  );
}

export function GamesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V8.5" />
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <circle cx="16" cy="13.5" r="1.6" />
    </Icon>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
      <circle cx="4" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 5.5-6.5 6.5L15 18.5" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5 10 7-10 7z" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.6 4.6L19 7" />
    </Icon>
  );
}

export function SoundIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5v5h3.2l4.8 4V5.5L7.2 9.5Z" />
      <path d="M15.5 9a5 5 0 0 1 0 6" />
      <path d="M17.8 6.6a8.4 8.4 0 0 1 0 10.8" />
    </Icon>
  );
}

export function HapticsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 8.5a5.5 5.5 0 0 1 0 7" />
      <path d="M9.5 6.2a9 9 0 0 1 0 11.6" />
      <path d="M13 3.9a12.5 12.5 0 0 1 0 16.2" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 5H5a1 1 0 0 0-1 1c0 2.5 2 4 4 4" />
      <path d="M16 5h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4" />
      <path d="M12 13.5V16" />
      <path d="M8 20h8" />
      <path d="M10 20v-1.5h4V20" />
    </Icon>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="9" width="17" height="11" rx="2" />
      <path d="M12 9v11" />
      <path d="M3.5 13h17" />
      <path d="M12 9.5c0-3-1.5-4.3-3.4-4.3a2.5 2.5 0 0 0 0 5Z" />
      <path d="M12 9.5c0-3 1.5-4.3 3.4-4.3a2.5 2.5 0 0 1 0 5Z" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 2" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 3v4.5h-4.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </Icon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </Icon>
  );
}

export function BugIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13" r="4" />
      <path d="M12 9V7M8 13H4.5M19.5 13H16M5 7l2 2M19 7l-2 2M5 19l2-2M19 19l-2-2" />
    </Icon>
  );
}

export function LogoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" />
      <path d="m12 7.4 4.6 4.6L12 16.6 7.4 12Z" />
    </Icon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 17.5 9 11l3.5 3.2L18 7.5M3.5 20.5h17" />
      <circle cx="18" cy="7.5" r="1.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}