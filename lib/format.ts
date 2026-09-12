export function formatCredits(value: number, options: { signed?: boolean } = {}): string {
  const absolute = new Intl.NumberFormat("en-US").format(Math.abs(value));
  if (options.signed) {
    return value > 0 ? `+${absolute}` : value < 0 ? `−${absolute}` : absolute;
  }
  return absolute;
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}