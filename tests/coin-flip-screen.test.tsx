import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoinFlipScreen } from "@/games/coin-flip/CoinFlipScreen";
import type { CoinFlipResult, CoinFlipState } from "@/games/coin-flip";
import type { GameRoundContext } from "@/core/game-engine";
import { useEconomyStore } from "@/stores/economy";

import styles from "@/games/coin-flip/coin-flip.module.css";

function resultOf(side: "heads" | "tails", win: boolean): CoinFlipResult {
  return {
    side,
    outcome: win ? "win" : "loss",
    wager: 100,
    multiplier: 2,
    payout: win ? 200 : 0,
  };
}

const winHeads = resultOf("heads", true);
const winTails = resultOf("tails", true);
const lossTails = resultOf("tails", false);

function paperEngine(result: CoinFlipResult) {
  return {
    gameId: "coin-flip",
    version: "test",
    beginRound: (_ctx: GameRoundContext, options: unknown) => {
      const o = options as { wager: number; picked: "heads" | "tails" };
      return {
        roundId: _ctx.roundId,
        wager: o.wager,
        picked: o.picked,
        startedAt: _ctx.startedAt,
      } satisfies CoinFlipState;
    },
    finishRound: (_ctx: GameRoundContext, state: CoinFlipState) => ({
      ...result,
      wager: state.wager,
      payout: result.outcome === "win" ? state.wager * 2 : 0,
    }),
  } as unknown as import("@/games/coin-flip").CoinFlipEngine;
}

function seedBalance(amount: number) {
  useEconomyStore.setState({ balance: amount, transactions: [], hydrated: true });
}

beforeEach(() => {
  seedBalance(25_000);
});

describe("CoinFlipScreen", () => {
  it("requires a side and a valid wager before flipping", async () => {
    const user = userEvent.setup();
    render(<CoinFlipScreen engine={paperEngine(winHeads)} />);
    const flip = screen.getByRole("button", { name: "Flip" });
    expect(flip).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("radio", { name: /heads/i }));
    expect(screen.getByRole("button", { name: "Flip" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("plays a winning round and credits the payout", async () => {
    const user = userEvent.setup();
    render(<CoinFlipScreen engine={paperEngine(winTails)} />);
    await user.click(screen.getByRole("radio", { name: /tails/i }));
    await user.click(screen.getByRole("button", { name: "Flip" }));

    await waitFor(() => {
      expect(screen.getByText("You win")).toBeTruthy();
    });
    expect(screen.getByRole("status", { name: "Round result" }).textContent).toMatch(
      /\+200 cr/,
    );
    expect(useEconomyStore.getState().balance).toBe(25_100);
  });

  it("plays a losing round and keeps the stake", async () => {
    const user = userEvent.setup();
    render(<CoinFlipScreen engine={paperEngine(lossTails)} />);
    await user.click(screen.getByRole("radio", { name: /tails/i }));
    await user.click(screen.getByRole("button", { name: "Flip" }));

    await waitFor(() => {
      expect(screen.getByText("You lose")).toBeTruthy();
    });
    expect(screen.getByRole("status", { name: "Round result" }).textContent).toMatch(
      /−100 cr/,
    );
    expect(useEconomyStore.getState().balance).toBe(24_900);
  });

  it("records a bet and a win transaction in the ledger", async () => {
    const user = userEvent.setup();
    render(<CoinFlipScreen engine={paperEngine(winHeads)} />);
    await user.click(screen.getByRole("radio", { name: /heads/i }));
    await user.click(screen.getByRole("button", { name: /^500$/ }));
    await user.click(screen.getByRole("button", { name: "Flip" }));

    await waitFor(() => {
      expect(screen.getByText("You win")).toBeTruthy();
    });
    const { transactions } = useEconomyStore.getState();
    const winTxn = transactions[0];
    const betTxn = transactions[1];
    expect(winTxn?.type).toBe("win");
    expect(winTxn?.change).toBe(1000);
    expect(betTxn?.type).toBe("bet");
    expect(betTxn?.change).toBe(-500);
  });

  it("disables play when the wager exceeds the balance", async () => {
    seedBalance(50);
    render(<CoinFlipScreen engine={paperEngine(winHeads)} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Flip" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("returns to a fresh round after a result", async () => {
    const user = userEvent.setup();
    render(<CoinFlipScreen engine={paperEngine(winHeads)} />);
    await user.click(screen.getByRole("radio", { name: /heads/i }));
    const flip = screen.getByRole("button", { name: "Flip" });
    await user.click(flip);
    await waitFor(() => {
      expect(screen.getByText("You win")).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: "New round" }));
    expect(screen.getByRole("button", { name: "Flip" })).toBeTruthy();
    expect(screen.queryByText("You win")).toBeNull();
  });

  it("wraps the coin faces in the 3D flip markup", async () => {
    const user = userEvent.setup();
    const { container } = render(<CoinFlipScreen engine={paperEngine(winHeads)} />);
    expect(container.querySelector(`.${styles.coin}`)).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: /heads/i }));
    await user.click(screen.getByRole("button", { name: "Flip" }));
    expect(await screen.findByText("It landed on heads.")).toBeTruthy();
  });
});