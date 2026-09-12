import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(globalThis.window, "matchMedia", {
  writable: true,
  value: () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  const h = ReactModule.createElement;
  return {
    default: ({
      href,
      children,
      onClick,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) =>
      h(
        "a",
        { href: typeof href === "string" ? href : "#", onClick, ...rest },
        children,
      ),
  };
});