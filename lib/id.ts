const cryptoObj = globalThis.crypto as Crypto | undefined;

let fallbackCounter = 0;

export function newId(): string {
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  fallbackCounter += 1;
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${stamp}-${fallbackCounter.toString(36)}-${rand}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}