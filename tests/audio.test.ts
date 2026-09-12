import { describe, expect, it } from "vitest";
import { createNoopSoundEngine, createWebAudioSoundEngine } from "@/core/audio";

class FakeGain {
  connectedTo: unknown = null;
  gain = {
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  };
  connect(target: unknown) {
    this.connectedTo = target;
    return this;
  }
}

class FakeOscillator {
  type = "sine";
  frequency = { setValueAtTime: () => undefined };
  detune = { setValueAtTime: () => undefined };
  connectedTo: unknown = null;
  started = 0;
  stopped = 0;
  connect(target: unknown) {
    this.connectedTo = target;
    return this;
  }
  start() {
    this.started += 1;
  }
  stop() {
    this.stopped += 1;
  }
}

class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  resume() {
    return Promise.resolve();
  }
}

const asContext = (audio: FakeAudioContext): AudioContext =>
  audio as unknown as AudioContext;

describe("sound engines", () => {
  it("noop engine never throws and honours toggling", () => {
    const engine = createNoopSoundEngine();
    expect(() => {
      engine.play("win");
      engine.setEnabled(false);
      engine.play("error");
    }).not.toThrow();
  });

  it("web engine falls back to silence when no AudioContext exists", () => {
    const engine = createWebAudioSoundEngine({ audioContext: () => null });
    expect(() => {
      engine.play("tap");
      engine.setEnabled(false);
      engine.play("win");
    }).not.toThrow();
  });

  it("web engine only schedules audio when enabled", () => {
    const audio = new FakeAudioContext();
    const engine = createWebAudioSoundEngine({ audioContext: () => asContext(audio) });

    engine.setEnabled(false);
    engine.play("win");
    expect(audio.oscillators).toHaveLength(0);

    engine.setEnabled(true);
    engine.play("win");
    expect(audio.oscillators.length).toBeGreaterThan(0);
    expect(audio.oscillators[0]?.started).toBe(1);
    expect(audio.oscillators[0]?.stopped).toBe(1);
  });

  it("win event schedules one oscillator per tone", () => {
    const audio = new FakeAudioContext();
    const engine = createWebAudioSoundEngine({ audioContext: () => asContext(audio) });
    engine.play("win");
    expect(audio.oscillators).toHaveLength(4);
  });

  it("respects the volume setting on the master gain", () => {
    const audio = new FakeAudioContext();
    const engine = createWebAudioSoundEngine({ audioContext: () => asContext(audio) });
    engine.play("tap");
    const firstMaster = audio.gains[0]!;
    expect(firstMaster.gain.value).toBeCloseTo(0.9);

    engine.setVolume(0.4);
    engine.play("tap");
    const secondMaster = audio.gains[2]!;
    expect(secondMaster.gain.value).toBeCloseTo(0.9 * 0.4);
    expect(audio.oscillators.length).toBeGreaterThan(0);
  });

  it("master gain routes to the destination", () => {
    const audio = new FakeAudioContext();
    const engine = createWebAudioSoundEngine({ audioContext: () => asContext(audio) });
    engine.play("tap");
    expect(audio.gains.length).toBeGreaterThan(0);
    const masterConnections = audio.gains.map((gain) => gain.connectedTo);
    expect(masterConnections).toContain(audio.destination);
  });
});