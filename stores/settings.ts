import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isThemeId, type ThemeId } from "@/design/themes/types";
import {
  createVersionedStateStorage,
  PERSISTENCE_KEYS,
} from "@/core/persistence";

export interface SettingsState {
  themeId: ThemeId;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  soundVolume: number;
  profileName: string;
  onboardingDismissed: boolean;
  setThemeId: (themeId: ThemeId) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setProfileName: (name: string) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
}

const DEFAULTS = {
  themeId: "system" as ThemeId,
  soundEnabled: true,
  hapticsEnabled: true,
  soundVolume: 0.7,
  profileName: "",
  onboardingDismissed: false,
};

const MAX_NAME_LENGTH = 24;

export function sanitizeProfileName(name: string): string {
  return name.trim().slice(0, MAX_NAME_LENGTH);
}

type PersistedSettings = Pick<
  SettingsState,
  | "themeId"
  | "soundEnabled"
  | "hapticsEnabled"
  | "soundVolume"
  | "profileName"
  | "onboardingDismissed"
>;

export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState, [], [], PersistedSettings>(
    (set) => ({
      ...DEFAULTS,
      setThemeId: (themeId) => set({ themeId }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setSoundVolume: (soundVolume) =>
        set({ soundVolume: Math.min(1, Math.max(0, soundVolume)) }),
      setProfileName: (profileName) =>
        set({ profileName: sanitizeProfileName(profileName) }),
      setOnboardingDismissed: (onboardingDismissed) => set({ onboardingDismissed }),
    }),
    {
      name: PERSISTENCE_KEYS.settings.key,
      storage: createJSONStorage<PersistedSettings>(() =>
        createVersionedStateStorage(PERSISTENCE_KEYS.settings.version),
      ),
      partialize: (state) => ({
        themeId: state.themeId,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        soundVolume: state.soundVolume,
        profileName: state.profileName,
        onboardingDismissed: state.onboardingDismissed,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedSettings> | undefined;
        return {
          ...current,
          themeId: p !== undefined && isThemeId(p.themeId) ? p.themeId : current.themeId,
          soundEnabled:
            p !== undefined && typeof p.soundEnabled === "boolean"
              ? p.soundEnabled
              : current.soundEnabled,
          hapticsEnabled:
            p !== undefined && typeof p.hapticsEnabled === "boolean"
              ? p.hapticsEnabled
              : current.hapticsEnabled,
          soundVolume:
            p !== undefined && typeof p.soundVolume === "number"
              ? Math.min(1, Math.max(0, p.soundVolume))
              : current.soundVolume,
          profileName:
            p !== undefined && typeof p.profileName === "string"
              ? sanitizeProfileName(p.profileName)
              : current.profileName,
          onboardingDismissed:
            p !== undefined && typeof p.onboardingDismissed === "boolean"
              ? p.onboardingDismissed
              : current.onboardingDismissed,
        };
      },
    },
  ),
);