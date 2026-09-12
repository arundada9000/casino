import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AppShell } from "@/components/shell/AppShell";

describe("AppShell", () => {
  it("offers the five primary destinations", () => {
    render(
      <AppShell>
        <main>content</main>
      </AppShell>,
    );

    const navs = screen.getAllByRole("navigation", { name: /primary/i });
    expect(navs.length).toBe(2);
    for (const nav of navs) {
      expect(within(nav).getByRole("link", { name: /home/i })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: /games/i })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: /wallet/i })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: /activity/i })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: /profile/i })).toBeInTheDocument();
    }
  });

  it("announces the active tab with aria-current", () => {
    render(
      <AppShell>
        <main>content</main>
      </AppShell>,
    );

    const navs = screen.getAllByRole("navigation", { name: /primary/i });
    expect(navs.length).toBeGreaterThan(0);
    const active = within(navs[0]!).getByRole("link", { name: /home/i });
    expect(active).toHaveAttribute("aria-current", "page");
    const resting = within(navs[0]!).getByRole("link", { name: /games/i });
    expect(resting).not.toHaveAttribute("aria-current");
  });

  it('targets content through a visible-on-focus "Skip to content" link', () => {
    render(
      <AppShell>
        <main>content</main>
      </AppShell>,
    );

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    const mains = screen.getAllByRole("main");
    expect(mains.some((el) => el.id === "main")).toBe(true);
  });

  it("renders page content inside the shell", () => {
    render(
      <AppShell>
        <h1>Healthy shell</h1>
      </AppShell>,
    );
    expect(screen.getByRole("heading", { name: "Healthy shell" })).toBeInTheDocument();
  });
});