import type { SoundEngine, SoundEvent } from "./types";

export type AudioContextFactory = () => AudioContext | null;

interface ToneSpec {
  type: OscillatorType;
  frequency: number;
  startsAt: number;
  duration: number;
  volume: number;
}

interface EventSpec {
  tones: ToneSpec[];
}

const EVENT_SPECS: Record<SoundEvent, EventSpec> = {
  tap: { tones: [{ type: "sine", frequency: 440, startsAt: 0, duration: 0.05, volume: 0.06 }] },
  select: {
    tones: [
      { type: "sine", frequency: 620, startsAt: 0, duration: 0.05, volume: 0.07 },
      { type: "sine", frequency: 830, startsAt: 0.045, duration: 0.06, volume: 0.06 },
    ],
  },
  navigate: { tones: [{ type: "sine", frequency: 520, startsAt: 0, duration: 0.07, volume: 0.05 }] },
  bet: {
    tones: [
      { type: "triangle", frequency: 340, startsAt: 0, duration: 0.09, volume: 0.1 },
      { type: "triangle", frequency: 260, startsAt: 0.07, duration: 0.1, volume: 0.09 },
    ],
  },
  "game-start": {
    tones: [
      { type: "triangle", frequency: 330, startsAt: 0, duration: 0.1, volume: 0.1 },
      { type: "triangle", frequency: 495, startsAt: 0.1, duration: 0.1, volume: 0.1 },
      { type: "triangle", frequency: 660, startsAt: 0.2, duration: 0.14, volume: 0.1 },
    ],
  },
  result: {
    tones: [
      { type: "sine", frequency: 784, startsAt: 0, duration: 0.08, volume: 0.08 },
      { type: "sine", frequency: 1047, startsAt: 0.08, duration: 0.1, volume: 0.07 },
    ],
  },
  win: {
    tones: [
      { type: "sine", frequency: 659, startsAt: 0, duration: 0.1, volume: 0.11 },
      { type: "sine", frequency: 831, startsAt: 0.11, duration: 0.12, volume: 0.11 },
      { type: "sine", frequency: 988, startsAt: 0.23, duration: 0.12, volume: 0.11 },
      { type: "sine", frequency: 1319, startsAt: 0.34, duration: 0.26, volume: 0.09 },
    ],
  },
  loss: {
    tones: [
      { type: "sine", frequency: 330, startsAt: 0, duration: 0.18, volume: 0.08 },
      { type: "sine", frequency: 262, startsAt: 0.14, duration: 0.24, volume: 0.08 },
      { type: "sine", frequency: 196, startsAt: 0.3, duration: 0.3, volume: 0.07 },
    ],
  },
  error: { tones: [{ type: "square", frequency: 200, startsAt: 0, duration: 0.12, volume: 0.05 }] },
  cashout: {
    tones: [
      { type: "sine", frequency: 1047, startsAt: 0, duration: 0.12, volume: 0.11 },
      { type: "sine", frequency: 1319, startsAt: 0.13, duration: 0.2, volume: 0.09 },
      { type: "sine", frequency: 1568, startsAt: 0.28, duration: 0.22, volume: 0.08 },
    ],
  },
};

/**
 * WebAudio sound engine. Creates a lazy `AudioContext` on first playback so
 * it can resume inside a user gesture (browsers block autoplay from page
 * load). Falls back to silence when WebAudio is unavailable.
 */
export function createWebAudioSoundEngine(
  options?: { audioContext?: AudioContextFactory },
): SoundEngine {
  let enabled = true;
  let volume = 1;
  let context: AudioContext | null | undefined;

  const defaultFactory: AudioContextFactory = () => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  };

  const getContext = options?.audioContext ?? defaultFactory;

  const contextOrNull = (): AudioContext | null => {
    if (context !== undefined) return context;
    context = getContext();
    if (context && context.state === "suspended") {
      void context.resume().catch(() => {
        // Autoplay policies may reject the first resume; play() after a
        // subsequent gesture will retry.
      });
    }
    return context;
  };

  return {
    play(event: SoundEvent): void {
      if (!enabled) return;
      const audio = contextOrNull();
      if (!audio) return;
      try {
        const now = audio.currentTime;
        const master = audio.createGain();
        master.gain.value = 0.9 * volume;
        master.connect(audio.destination);
        for (const tone of EVENT_SPECS[event].tones) {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          gain.gain.setValueAtTime(0, now + tone.startsAt);
          gain.gain.linearRampToValueAtTime(
            tone.volume,
            now + tone.startsAt + Math.min(0.012, tone.duration / 2),
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + tone.startsAt + tone.duration,
          );
          osc.type = tone.type;
          osc.frequency.setValueAtTime(tone.frequency, now + tone.startsAt);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + tone.startsAt);
          osc.stop(now + tone.startsAt + tone.duration + 0.02);
        }
      } catch {
        // Some embedded webviews throw on node creation; stay silent.
      }
    },
    setEnabled(next: boolean): void {
      enabled = next;
    },
    setVolume(next: number): void {
      volume = Math.min(1, Math.max(0, next));
    },
  };
}