"use client";

import { useTheme } from "@/design/themes/ThemeProvider";
import {
  THEMES,
  getConcreteTheme,
  type ThemeId,
} from "@/design/themes/theme";

import styles from "./theme-selector.module.css";

function Swatch({ themeId }: { themeId: ThemeId }) {
  if (themeId === "system") {
    const dark = getConcreteTheme("slate");
    const light = getConcreteTheme("ivory");
    return (
      <span
        className={styles.swatch}
        style={{
          background: `linear-gradient(135deg, ${dark.palette.background} 0% 50%, ${light.palette.background} 50% 100%)`,
        }}
        aria-hidden="true"
      />
    );
  }
  const def = getConcreteTheme(themeId);
  return (
    <span
      className={styles.swatch}
      style={{ background: def.palette.background }}
      aria-hidden="true"
    >
      <span
        className={styles.swatchDot}
        style={{ background: def.palette.accent }}
      />
    </span>
  );
}

export function ThemeSelector({ label = "Appearance" }: { label?: string }) {
  const { themeId, setTheme } = useTheme();

  return (
    <div>
      <p className={styles.label}>{label}</p>
      <div className={styles.group} role="radiogroup" aria-label={label}>
        {THEMES.map((id) => {
          const active = id === themeId;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={id === "system" ? "System appearance" : `${id} theme`}
              className={styles.chip}
              data-active={active || undefined}
              onClick={() => setTheme(id)}
            >
              <Swatch themeId={id} />
              <span>{id === "system" ? "System" : id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}