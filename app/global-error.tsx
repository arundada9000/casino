"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "96px 24px", textAlign: "center" as const }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#b9bfcc" }}>{error.message}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}