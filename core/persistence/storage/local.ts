import type { StorageAdapter } from "../types";

function accessLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = "__aurelia_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/**
 * A defensive localStorage adapter. Returns a no-op set when the browser
 * blocks storage (private mode, disabled cookies, SSR) so callers never
 * need to guard against storage exceptions themselves.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  const owner = accessLocalStorage();
  const noop: StorageAdapter = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
  if (!owner) return noop;

  return {
    getItem(key) {
      try {
        return owner.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        owner.setItem(key, value);
      } catch {
        // Quota or privacy failure: intentionally ignored so the app keeps running.
      }
    },
    removeItem(key) {
      try {
        owner.removeItem(key);
      } catch {
        // Ignored.
      }
    },
  };
}