import { AppError } from "@/core/error/AppError";

export const EconomyErrorCodes = {
  INVALID_AMOUNT: "economy.invalid-amount",
  INSUFFICIENT_CREDITS: "economy.insufficient-credits",
  OVERFLOW: "economy.overflow",
  UNDERFLOW: "economy.underflow",
  INVALID_TRANSACTION_TYPE: "economy.invalid-transaction-type",
  INVALID_STATE: "economy.invalid-state",
} as const;

export type EconomyErrorCode = (typeof EconomyErrorCodes)[keyof typeof EconomyErrorCodes];

export class EconomyError extends AppError {
  constructor(code: EconomyErrorCode, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
    this.name = "EconomyError";
  }
}

export class InsufficientCreditsError extends EconomyError {
  constructor(previousBalance: number, requested: number, context?: Record<string, unknown>) {
    super(
      EconomyErrorCodes.INSUFFICIENT_CREDITS,
      `Insufficient credits: requested ${requested}, available ${previousBalance}.`,
      { ...context, previousBalance, requested },
    );
    this.name = "InsufficientCreditsError";
  }
}

export function assertValidCreditAmount(
  amount: unknown,
  context?: Record<string, unknown>,
): asserts amount is number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new EconomyError(
      EconomyErrorCodes.INVALID_AMOUNT,
      "Credit amounts must be finite numbers.",
      context,
    );
  }
  if (!Number.isInteger(amount)) {
    throw new EconomyError(
      EconomyErrorCodes.INVALID_AMOUNT,
      "Credit amounts must be whole credits.",
      context,
    );
  }
  if (amount <= 0) {
    throw new EconomyError(
      EconomyErrorCodes.INVALID_AMOUNT,
      "Credit amounts must be greater than zero.",
      { ...context, amount },
    );
  }
}