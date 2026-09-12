export class AppError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError || (typeof error === "object" && error !== null && "code" in error && "message" in error);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function errorCode(error: unknown): string | undefined {
  if (isAppError(error)) return (error as AppError).code;
  return undefined;
}