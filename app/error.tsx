"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[aurelia:route]", "Route-level error", error);
  }, [error]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "96px 24px", textAlign: "center" as const }}>
      <h1 style={{ fontFamily: "var(--a-font-serif, Georgia, serif)", fontSize: 28, margin: "0 0 8px" }}>
        Something went wrong
      </h1>
      <p style={{ color: "var(--a-color-textSecondary, #b9bfcc)" }}>
        The table hit a snag. Try again, or head back.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 16,
          padding: "10px 18px",
          borderRadius: 999,
          background: "var(--a-color-accent, #d0a96f)",
          color: "var(--a-color-textOnAccent, #1a1a1c)",
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </div>
  );
}