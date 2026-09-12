import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouletteScreen } from "@/games/roulette/RouletteScreen";
import { ROULETTE_SPIN_MS, type RouletteBet, type RouletteEngine, type RouletteResult, type RouletteState } from "@/games/roulette";
import type { GameRoundContext } from "@/core/game-engine";
import { useEconomyStore } from "@/stores/economy";

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function resultOf(number: number, totalPayout: number): RouletteResult {
  return {
    number,
    color: number === 0 ? "green" : RED.has(number) ? "red" : "black",
    bets: [],
    totalWager: 100,
    totalPayout,
  };
}

function paperEngine(result: RouletteResult) {
  return {
    gameId: "roulette",
    version: "test",
    beginRound: (_ctx: GameRoundContext, options: unknown) => {
      const o = options as { bets: readonly RouletteBet[] };
      return {
        roundId: _ctx.roundId,
        startedAt: _ctx.startedAt,
        bets: o.bets,
        totalWager: o.bets.reduce((sum, item) => sum + item.wager, 0),
      } satisfies RouletteState;
    },
    finishRound: (_ctx: GameRoundContext, state: RouletteState) => ({
      ...result,
      totalWager: state.totalWager,
      totalPayout: result.totalPayout,
    }),
  } as unknown as RouletteEngine;
}

function seedBalance(amount: number) {
  useEconomyStore.setState({ balance: amount, transactions: [], hydrated: true });
}

beforeEach(() => {
  seedBalance(25_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RouletteScreen", () => {
  it("starts with the spin disabled until a chip is placed", async () => {
    const user = userEvent.setup();
    render(<RouletteScreen engine={paperEngine(resultOf(18, 200))} />);
    expect(screen.getByRole("button", { name: "Spin" })).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("button", { name: "Number 18" }));
    const spin = screen.getByRole("button", { name: "Spin" });
    expect(spin).toHaveProperty("disabled", false);
    expect(screen.getByText(/1 chip · 100 cr total/)).toBeTruthy();
  });

  it("undoes the last placement and clears all bets", async () => {
    const user = userEvent.setup();
    render(<RouletteScreen engine={paperEngine(resultOf(18, 0))} />);
    await user.click(screen.getByRole("button", { name: "Number 18" }));
    await user.click(screen.getByRole("button", { name: "Number 7" }));
    expect(screen.getByText(/2 chips · 200 cr total/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Undo last" }));
    expect(screen.getByText(/1 chip · 100 cr total/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Clear bets" }));
    expect(screen.getByText(/Tap the table to place a chip/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Spin" })).toHaveProperty("disabled", true);
  });

  it("spins, matches a winning number, and credits the payout", async () => {
    vi.useFakeTimers();
    render(<RouletteScreen engine={paperEngine(resultOf(18, 200))} />);
    fireEvent.click(screen.getByRole("button", { name: "Number 18" }));
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    act(() => {
      vi.advanceTimersByTime(ROULETTE_SPIN_MS);
    });

    const result = screen.getByRole("status", { name: "Round result" });
    expect(result.textContent).toMatch(/You win/);
    expect(result.textContent).toMatch(/18/);
    expect(useEconomyStore.getState().balance).toBe(25_000 - 100 + 200);
  });

  it("records a no-match result and keeps the stake", async () => {
    vi.useFakeTimers();
    render(<RouletteScreen engine={paperEngine(resultOf(4, 0))} />);
    fireEvent.click(screen.getByRole("button", { name: "Number 4" }));
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    act(() => {
      vi.advanceTimersByTime(ROULETTE_SPIN_MS);
    });

    const result = screen.getByRole("status", { name: "Round result" });
    expect(result.textContent).toMatch(/No match/);
    expect(useEconomyStore.getState().balance).toBe(24_900);
  });

  it("returns to a fresh spin and shows round history after a result", async () => {
    vi.useFakeTimers();
    render(<RouletteScreen engine={paperEngine(resultOf(18, 200))} />);
    fireEvent.click(screen.getByRole("button", { name: "Number 18" }));
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    act(() => {
      vi.advanceTimersByTime(ROULETTE_SPIN_MS);
    });

    expect(screen.getByRole("button", { name: "New round" })).toBeTruthy();
    expect(screen.getByLabelText("Round history").textContent).toContain("18");
    fireEvent.click(screen.getByRole("button", { name: "New round" }));
    expect(screen.getByRole("button", { name: "Spin" })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Round result" })).toBeNull();
  });
});