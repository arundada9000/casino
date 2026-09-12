import type { StateStorage } from "zustand/middleware";
import { readVersioned, writeVersioned, removeVersioned } from "./safe";
import type { StorageAdapter } from "./types";
import { createLocalStorageAdapter } from "./storage/local";

/**
 * Builds a zustand-compatible storage that wraps persisted values in a
 * versioned envelope (`{ v, data }`). Corrupted or mismatched payloads
 * hydrate as `null`, so stores fall back to their initial state safely.
 */
export function createVersionedStateStorage(
  version: number,
  adapter: StorageAdapter = createLocalStorageAdapter(),
): StateStorage {
  return {
    getItem(name) {
      return readVersioned<string | null>(adapter, name, version, null);
    },
    setItem(name, value) {
      writeVersioned(adapter, name, version, value);
    },
    removeItem(name) {
      removeVersioned(adapter, name);
    },
  };
}