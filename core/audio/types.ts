export const SOUND_EVENTS = [
  "tap",
  "select",
  "bet",
  "game-start",
  "result",
  "win",
  "loss",
  "error",
  "navigate",
  "cashout",
] as const;

export type SoundEvent = (typeof SOUND_EVENTS)[number];

export interface SoundEngine {
  play(event: SoundEvent): void;
  setEnabled(enabled: boolean): void;
  setVolume(volume: number): void;
}

export function isSoundEvent(value: unknown): value is SoundEvent {
  return typeof value === "string" && (SOUND_EVENTS as readonly string[]).includes(value);
}