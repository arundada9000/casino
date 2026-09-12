import type { SoundEngine, SoundEvent } from "./types";

/**
 * Placeholder engine used until Milestone 1 wires real audio. The interface
 * is stable so game code can depend on it without knowing the implementation.
 */
export function createNoopSoundEngine(): SoundEngine {
  return {
    play(_event: SoundEvent): void {
      // Intentionally silent.
    },
    setEnabled(_enabled: boolean): void {
      // Intentionally silent.
    },
    setVolume(_volume: number): void {
      // Intentionally silent.
    },
  };
}