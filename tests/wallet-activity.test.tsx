import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WalletPage from "@/app/(shell)/wallet/page";
import ActivityPage from "@/app/(shell)/activity/page";
import { useEconomyStore } from "@/stores/economy";

describe("wallet and activity pages", () => {
  beforeEach(() => {
    useEconomyStore.setState({ balance: 0, transactions: [] });
  });

  it("wallet shows a transaction from the ledger", () => {
    useEconomyStore.getState().award(500);
    render(<WalletPage />);

    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("+500")).toBeInTheDocument();
  });

  it("wallet shows an empty state before any activity", () => {
    render(<WalletPage />);
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("activity groups recorded transactions by day", () => {
    useEconomyStore.getState().award(500);
    useEconomyStore.getState().bet(300);
    render(<ActivityPage />);

    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("Bet placed")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});