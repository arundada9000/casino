export const PERSISTENCE_KEYS = {
  settings: { key: "aurelia.settings", version: 1 },
  economy: { key: "aurelia.economy", version: 1 },
  onboarding: { key: "aurelia.onboarding", version: 1 },
} as const;

export type PersistenceKey = keyof typeof PERSISTENCE_KEYS;

export { readVersioned, writeVersioned, removeVersioned } from "./safe";
export { createVersionedStateStorage } from "./state-storage";
export { createLocalStorageAdapter } from "./storage/local";
export { createMemoryAdapter } from "./storage/memory";
export type { StorageAdapter } from "./types";

export function isPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.localStorage;
    const probe = "__aurelia_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}