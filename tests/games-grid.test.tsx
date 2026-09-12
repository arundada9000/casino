import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import GamesPage from "@/app/(shell)/games/page";
import { GAME_REGISTRY } from "@/core/game-engine";

describe("Games library", () => {
  it("lists every registered game", () => {
    render(<GamesPage />);
    for (const game of GAME_REGISTRY) {
      expect(screen.getByRole("heading", { name: game.name })).toBeInTheDocument();
    }
  });

  it("links implemented games to their play route", () => {
    render(<GamesPage />);
    const implemented = GAME_REGISTRY.filter((g) => g.availability === "implemented");
    for (const game of implemented) {
      const link = screen.getByRole("link", { name: new RegExp(game.name) });
      expect(link).toHaveAttribute("href", `/play/${game.id}`);
    }
  });

  it("marks conceptual games with their milestone", () => {
    render(<GamesPage />);
    const conceptual = GAME_REGISTRY.filter((g) => g.availability === "conceptual");
    for (const game of conceptual) {
      const card = screen.getByRole("article", { name: new RegExp(game.name) });
      expect(
        within(card).getByText(new RegExp(`Milestone ${game.milestone}`)),
      ).toBeInTheDocument();
    }
  });
});