"use client";

import { useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "@/core/error";
import { ThemeProvider } from "@/design/themes/ThemeProvider";
import { useEconomyStore } from "@/stores/economy";
import { useSettingsStore } from "@/stores/settings";
import { setFeedbackSettings } from "@/lib/app-feedback";

export function Providers({ children }: { children: ReactNode }) {
  const ensureInitialAllocation = useEconomyStore(
    (state) => state.ensureInitialAllocation,
  );
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const soundVolume = useSettingsStore((state) => state.soundVolume);

  useEffect(() => {
    ensureInitialAllocation();
  }, [ensureInitialAllocation]);

  useEffect(() => {
    setFeedbackSettings({ soundEnabled, hapticsEnabled, soundVolume });
  }, [soundEnabled, hapticsEnabled, soundVolume]);

  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  );
}