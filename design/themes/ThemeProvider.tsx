"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { resolveTheme, type ResolvedTheme, type ThemeId } from "./theme";
import { applyCssVariables } from "@/design/tokens/css-variables";
import { usePrefersDarkMode } from "@/hooks/usePrefersDarkMode";
import { useSettingsStore } from "@/stores/settings";

interface ThemeContextValue {
  themeId: ThemeId;
  resolved: ResolvedTheme;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMetaThemeColor(color: string): string {
  return color;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useSettingsStore((state) => state.themeId);
  const setThemeId = useSettingsStore((state) => state.setThemeId);
  const prefersDark = usePrefersDarkMode();

  const resolved = useMemo(
    () => resolveTheme(themeId, prefersDark),
    [themeId, prefersDark],
  );

  useEffect(() => {
    const root = document.documentElement;
    applyCssVariables(root, resolved.palette);
    root.dataset.theme = resolved.id;
    root.dataset.colorScheme = resolved.colorScheme;
    root.style.colorScheme = resolved.colorScheme;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) {
      meta.content = resolveMetaThemeColor(resolved.palette.background);
    }
  }, [resolved]);

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeId(next);
    },
    [setThemeId],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, resolved, setTheme }),
    [themeId, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}