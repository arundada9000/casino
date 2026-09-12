import type { HapticEngine, HapticEvent } from "./types";

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibrate can throw on some platforms; ignore.
    }
  }
}

const PATTERNS: Record<HapticEvent, number[]> = {
  tap: [8],
  selection: [12],
  success: [16, 40, 20],
  warning: [30, 60, 30],
  heavy: [40],
  impact: [24, 50, 20],
};

/**
 * Web haptics engine. `navigator.vibrate` is supported on many Android
 * browsers and PWA-installed apps; iOS Safari ignores it gracefully.
 */
export function createWebHapticEngine(): HapticEngine {
  let enabled = true;
  return {
    trigger(event: HapticEvent): void {
      if (!enabled) return;
      vibrate(PATTERNS[event]);
    },
    setEnabled(next: boolean): void {
      enabled = next;
      if (!next) vibrate([]);
    },
  };
}

export function createNoopHapticEngine(): HapticEngine {
  return {
    trigger(_event: HapticEvent): void {},
    setEnabled(_enabled: boolean): void {},
  };
}