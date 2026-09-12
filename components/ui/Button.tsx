"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { feedback } from "@/lib/app-feedback";

import styles from "./button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  feedbackEvent?: "select" | "tap" | "bet" | "error";
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  feedbackEvent = "select",
  icon,
  children,
  className,
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[variant],
        styles[size],
        className ?? "",
      ].join(" ")}
      data-variant={variant}
      disabled={disabled}
      onClick={(event) => {
        if (disabled) return;
        feedback(feedbackEvent);
        onClick?.(event);
      }}
      {...rest}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children ? <span className={styles.label}>{children}</span> : null}
    </button>
  );
}