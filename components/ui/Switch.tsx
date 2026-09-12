"use client";

import { feedback } from "@/lib/app-feedback";

import styles from "./switch.module.css";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      data-on={checked || undefined}
      onClick={() => {
        if (disabled) return;
        feedback("select");
        onChange(!checked);
      }}
    >
      <span className={styles.knob} />
    </button>
  );
}