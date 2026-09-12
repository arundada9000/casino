import { createNoopSoundEngine, createWebAudioSoundEngine } from "@/core/audio";
import type { SoundEngine, SoundEvent } from "@/core/audio";
import {
  createNoopHapticEngine,
  createWebHapticEngine,
} from "@/core/haptics";
import type { HapticEvent } from "@/core/haptics";

const HAPTIC_FOR_SOUND: Partial<Record<SoundEvent, HapticEvent>> = {
  tap: "tap",
  select: "selection",
  navigate: "tap",
  bet: "impact",
  "game-start": "impact",
  result: "selection",
  win: "success",
  loss: "warning",
  error: "warning",
  cashout: "success",
};

type SoundRef = ReturnType<typeof createNoopSoundEngine>;
type HapticRef = ReturnType<typeof createNoopHapticEngine>;

let sound: SoundRef | undefined;
let haptic: HapticRef | undefined;
let soundOn = true;
let hapticsOn = true;
let soundVolume = 1;

function ensureEngines(): { sound: SoundEngine; haptic: HapticRef } {
  if (sound === undefined) {
    sound =
      typeof window === "undefined"
        ? createNoopSoundEngine()
        : createWebAudioSoundEngine();
    sound.setEnabled(soundOn);
    sound.setVolume(soundVolume);
  }
  if (haptic === undefined) {
    haptic =
      typeof window === "undefined"
        ? createNoopHapticEngine()
        : createWebHapticEngine();
    haptic.setEnabled(hapticsOn);
  }
  return { sound, haptic };
}

export function feedback(event: SoundEvent): void {
  const engines = ensureEngines();
  engines.sound.play(event);
  const hapticEvent = HAPTIC_FOR_SOUND[event];
  if (hapticEvent) {
    engines.haptic.trigger(hapticEvent);
  }
}

export function setFeedbackSettings(settings: {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  soundVolume?: number;
}): void {
  soundOn = settings.soundEnabled;
  hapticsOn = settings.hapticsEnabled;
  if (typeof settings.soundVolume === "number") {
    soundVolume = Math.min(1, Math.max(0, settings.soundVolume));
  }
  if (sound) {
    sound.setEnabled(soundOn);
    sound.setVolume(soundVolume);
  }
  if (haptic) haptic.setEnabled(hapticsOn);
}