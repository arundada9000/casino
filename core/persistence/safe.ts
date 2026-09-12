import type { StorageAdapter } from "./types";

interface VersionedEnvelope<T> {
  v: number;
  data: T;
}

/**
 * Reads a versioned payload. Any malformed data, non-matching version, or
 * storage failure resolves to the provided fallback instead of throwing.
 */
export function readVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  version: number,
  fallback: T,
): T {
  let raw: string | null = null;
  try {
    raw = adapter.getItem(key);
  } catch {
    return fallback;
  }
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw) as VersionedEnvelope<T>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.v !== "number" ||
      parsed.v !== version
    ) {
      return fallback;
    }
    return parsed.data;
  } catch {
    return fallback;
  }
}

export function writeVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  version: number,
  data: T,
): void {
  const envelope: VersionedEnvelope<T> = { v: version, data };
  try {
    adapter.setItem(key, JSON.stringify(envelope));
  } catch {
    // Persistence failure is non-fatal for the application.
  }
}

export function removeVersioned(adapter: StorageAdapter, key: string): void {
  try {
    adapter.removeItem(key);
  } catch {
    // Ignored.
  }
}