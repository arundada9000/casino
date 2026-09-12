"use client";

import { useSyncExternalStore } from "react";

function match(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(query);
}

function subscribeTo(query: string) {
  return (callback: () => void): (() => void) => {
    const mql = match(query);
    if (!mql) return () => undefined;
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
}

function getSnapshotFor(query: string) {
  return (): boolean => mqlMatches(query);
}

function mqlMatches(query: string): boolean {
  return match(query)?.matches ?? false;
}

const reducedMotionSnapshot = (): boolean => mqlMatches("(prefers-reduced-motion: reduce)");

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeTo("(prefers-reduced-motion: reduce)"),
    reducedMotionSnapshot,
    (): boolean => false,
  );
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribeTo(query), getSnapshotFor(query), () => false);
}