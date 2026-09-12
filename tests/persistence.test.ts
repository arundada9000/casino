import { describe, expect, it } from "vitest";
import {
  createMemoryAdapter,
  createVersionedStateStorage,
  readVersioned,
  writeVersioned,
} from "@/core/persistence";

describe("memory adapter", () => {
  it("round-trips values and supports removal", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.getItem("k")).toBeNull();
    adapter.setItem("k", "v");
    expect(adapter.getItem("k")).toBe("v");
    adapter.removeItem("k");
    expect(adapter.getItem("k")).toBeNull();
  });
});

describe("versioned envelopes", () => {
  const adapter = createMemoryAdapter();
  const KEY = "test.key";

  it("returns the fallback when the key is missing", () => {
    expect(readVersioned(adapter, KEY, 1, "fallback")).toBe("fallback");
  });

  it("returns the fallback on version mismatch", () => {
    writeVersioned(adapter, KEY, 2, { hello: true });
    expect(readVersioned(adapter, KEY, 1, null)).toBeNull();
  });

  it("returns the fallback on corrupted payloads", () => {
    adapter.setItem(KEY, "{not json!!");
    expect(readVersioned(adapter, KEY, 1, [])).toEqual([]);
    adapter.setItem(KEY, JSON.stringify({ v: 1, data: [1] }));
    expect(readVersioned(adapter, KEY, 1, [])).toEqual([1]);
  });

  it("isolates values between keys", () => {
    writeVersioned(adapter, "a", 1, 10);
    expect(readVersioned(adapter, "b", 1, 0)).toBe(0);
  });
});

describe("versioned state storage (zustand compatible)", () => {
  it("persists and rehydrates the inner payload", () => {
    const storage = createVersionedStateStorage(1, createMemoryAdapter());
    const payload = JSON.stringify({ balance: 500 });
    storage.setItem("aurelia.economy", payload);
    expect(storage.getItem("aurelia.economy")).toBe(payload);
    storage.removeItem("aurelia.economy");
    expect(storage.getItem("aurelia.economy")).toBeNull();
  });

  it("returns null when the stored payload is for another version", () => {
    const storageV1 = createVersionedStateStorage(1, createMemoryAdapter());
    storageV1.setItem("k", "x");
    const storageV2 = createVersionedStateStorage(2, createMemoryAdapter());
    expect(storageV2.getItem("k")).toBeNull();
  });
});