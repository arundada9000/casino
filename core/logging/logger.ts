export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function defaultMinLevel(): LogLevel {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return "info";
  }
  return "debug";
}

let minLevel: LogLevel = defaultMinLevel();

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

type LogArgs = unknown[];

function write(level: LogLevel, scope: string, message: string, args: LogArgs): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return;
  const prefix = `[aurelia:${scope}] ${message}`;
  const optional = args.length > 0 ? args : [];
  if (level === "debug") {
    console.debug(prefix, ...optional);
  } else if (level === "info") {
    console.info(prefix, ...optional);
  } else if (level === "warn") {
    console.warn(prefix, ...optional);
  } else {
    console.error(prefix, ...optional);
  }
}

export interface Logger {
  debug(message: string, ...args: LogArgs): void;
  info(message: string, ...args: LogArgs): void;
  warn(message: string, ...args: LogArgs): void;
  error(message: string, ...args: LogArgs): void;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, ...args) => write("debug", scope, message, args),
    info: (message, ...args) => write("info", scope, message, args),
    warn: (message, ...args) => write("warn", scope, message, args),
    error: (message, ...args) => write("error", scope, message, args),
  };
}

export const logger = createLogger("app");

export function withScope(scope: string): Logger {
  return createLogger(scope);
}