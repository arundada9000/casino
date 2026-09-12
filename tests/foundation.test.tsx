import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FoundationScreen } from "@/components/foundation/FoundationScreen";
import { ThemeProvider } from "@/design/themes/ThemeProvider";
import { THEMES } from "@/design/themes/theme";

describe("FoundationScreen", () => {
  it("renders the foundation identity and subsystem status", () => {
    render(
      <ThemeProvider>
        <FoundationScreen />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Aurelia", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Foundation build · Milestone 0")).toBeInTheDocument();
    expect(screen.getByText("System status")).toBeInTheDocument();
    expect(screen.getByText("Virtual wallet")).toBeInTheDocument();
    expect(screen.getByText(/simulation only/i)).toBeInTheDocument();
  });

  it("offers every theme choice as a radio button", async () => {
    render(
      <ThemeProvider>
        <FoundationScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("radio")).toHaveLength(THEMES.length);
    });
  });
});