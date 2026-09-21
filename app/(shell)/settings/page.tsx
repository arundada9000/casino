"use client";

import { useState } from "react";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { GearIcon, HapticsIcon, PlayIcon, SoundIcon, SlidersIcon } from "@/components/ui/icons";
import { useSettingsStore } from "@/stores/settings";
import { useMounted } from "@/hooks/useMounted";
import { isPersistenceAvailable } from "@/core/persistence";
import { feedback, setFeedbackSettings } from "@/lib/app-feedback";
import { resetAllAppData } from "@/lib/reset";

import styles from "./settings.module.css";

export default function SettingsPage() {
  const mounted = useMounted();
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const soundVolume = useSettingsStore((state) => state.soundVolume);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setSoundVolume = useSettingsStore((state) => state.setSoundVolume);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const previewFeedback = () => {
    window.setTimeout(() => feedback("bet"), 220);
    window.setTimeout(() => feedback("win"), 560);
    window.setTimeout(() => feedback("loss"), 980);
    window.setTimeout(() => feedback("select"), 1300);
  };

  return (
    <div>
      <LargeTitle subtitle="Tune Aurelia to feel right.">Settings</LargeTitle>

      <section className={styles.groupBlock}>
        <h2 className={styles.groupTitle}>Appearance</h2>
        <div className={styles.surface}>
          <ThemeSelector label="Theme" />
        </div>
      </section>

      <ListGroup title="Feedback">
        <ListRow
          icon={<SoundIcon size={17} />}
          title="Sound effects"
          subtitle="Short UI sounds from the WebAudio engine"
          trailing={
            <Switch
              checked={soundEnabled}
              label="Sound effects"
              onChange={(next) => {
                setSoundEnabled(next);
                setFeedbackSettings({ soundEnabled: next, hapticsEnabled, soundVolume });
              }}
            />
          }
        />
        <ListRow
          icon={<HapticsIcon size={17} />}
          title="Haptics"
          subtitle="Vibration on taps and results"
          trailing={
            <Switch
              checked={hapticsEnabled}
              label="Haptics"
              onChange={(next) => {
                setHapticsEnabled(next);
                setFeedbackSettings({ soundEnabled, hapticsEnabled: next, soundVolume });
              }}
            />
          }
        />
        <ListRow
          icon={<SlidersIcon size={17} />}
          title="Volume"
          subtitle="Total loudness of every sound effect"
          trailing={
            <span className={styles.volumeControl}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(soundVolume * 100)}
                aria-label="Sound volume"
                className={styles.slider}
                onChange={(event) => {
                  const next = Number(event.target.value) / 100;
                  setSoundVolume(next);
                  setFeedbackSettings({ soundEnabled, hapticsEnabled, soundVolume: next });
                  feedback("select");
                }}
              />
              <span className={styles.volumeValue}>{Math.round(soundVolume * 100)}</span>
            </span>
          }
        />
        <ListRow
          icon={<PlayIcon size={17} />}
          title="Test sound & haptics"
          subtitle="Hear the bet, win, loss, and selection chimes"
          onPress={previewFeedback}
        />
      </ListGroup>

      <ListGroup title="Storage" footer="Settings and your wallet are saved in this browser.">
        <ListRow
          icon={<SlidersIcon size={17} />}
          title="Persistence"
          trailing={mounted ? (isPersistenceAvailable() ? "local storage" : "ephemeral") : "..."}
        />
      </ListGroup>

      <ListGroup
        title="Data"
        footer="Reset wipes your wallet and preferences and starts a fresh allocation."
      >
        <ListRow
          icon={<GearIcon size={17} />}
          title="Reset all data"
          destructive
          onPress={() => {
            setConfirmingReset(true);
            window.setTimeout(() => setConfirmingReset(false), 4000);
          }}
        />
      </ListGroup>

      {confirmingReset ? (
        <Button
          variant="danger"
          size="md"
          onClick={() => {
            resetAllAppData();
            window.location.reload();
          }}
        >
          Tap again to confirm reset
        </Button>
      ) : null}
    </div>
  );
}