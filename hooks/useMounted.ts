"use client";

import { useEffect, useState } from "react";

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const activate = (): void => setMounted(true);
    if (typeof requestAnimationFrame === "function") {
      const frame = requestAnimationFrame(activate);
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(activate, 0);
    return () => clearTimeout(timer);
  }, []);
  return mounted;
}