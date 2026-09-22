"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement) {
    return Boolean(target.closest("button, a, input, textarea, select"));
  }
  return false;
}

/**
 * Lets Space/Enter trigger a screen's primary action when nothing else has
 * focus. Native controls (buttons, links, inputs) keep their built-in
 * behaviour, so activating a focused control never double-fires the action.
 */
export function usePrimaryActionKey(
  onAction: () => void,
  disabled: boolean,
): void {
  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      onAction();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAction, disabled]);
}