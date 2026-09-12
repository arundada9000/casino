"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "96px 24px", textAlign: "center" as const }}>
      <p style={{ fontFamily: "var(--a-font-serif, Georgia, serif)", fontSize: 64, margin: 0 }}>
        404
      </p>
      <p>This page is not on the floor.</p>
      <Link
        href="/"
        style={{ color: "var(--a-color-accent, #d0a96f)", textDecoration: "none" }}
      >
        Return home
      </Link>
    </div>
  );
}