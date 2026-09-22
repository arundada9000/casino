import { PERSISTENCE_KEYS } from "@/core/persistence";

export function resetAllAppData(): void {
  if (typeof window === "undefined") return;
  for (const entry of Object.values(PERSISTENCE_KEYS)) {
    window.localStorage.removeItem(entry.key);
  }
}