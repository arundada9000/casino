import { describe, expect, it } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePrimaryActionKey } from "@/hooks/usePrimaryActionKey";

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [pressed, setPressed] = useState(0);
  usePrimaryActionKey(() => setPressed((n) => n + 1), disabled);
  return (
    <div>
      <span data-testid="count">{pressed}</span>
      <button type="button" data-testid="button">
        Target
      </button>
      <input data-testid="field" />
    </div>
  );
}

describe("usePrimaryActionKey", () => {
  it("fires on Space and Enter from the body", () => {
    const { rerender } = render(<Harness />);
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    rerender(<Harness />);
  });

  it("ignores modified keys", () => {
    render(<Harness />);
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    fireEvent.keyDown(window, { key: " ", ctrlKey: true });
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("leaves native controls to their built-in behaviour", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByTestId("button"), { key: " " });
    fireEvent.keyDown(screen.getByTestId("field"), { key: " " });
    fireEvent.keyDown(screen.getByTestId("field"), { key: "Enter" });
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("stays silent while disabled", () => {
    render(<Harness disabled />);
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});