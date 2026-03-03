"use client";
import { useEffect, useState } from "react";

export function useMode() {
  const getMode = () =>
    typeof document !== "undefined" &&
    document.querySelector("html")?.classList.contains("dark")
      ? "dark"
      : "light";

  const [mode, setMode] = useState(getMode);

  useEffect(() => {
    const html = document.querySelector("html");
    if (!html) return;

    const observer = new MutationObserver(() => {
      setMode(getMode());
    });

    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return mode;
}
