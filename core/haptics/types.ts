export const HAPTIC_EVENTS = [
  "tap",
  "selection",
  "success",
  "warning",
  "heavy",
  "impact",
] as const;

export type HapticEvent = (typeof HAPTIC_EVENTS)[number];

export interface HapticEngine {
  trigger(event: HapticEvent): void;
  setEnabled(enabled: boolean): void;
}

export function isHapticEvent(value: unknown): value is HapticEvent {
  return typeof value === "string" && (HAPTIC_EVENTS as readonly string[]).includes(value);
}