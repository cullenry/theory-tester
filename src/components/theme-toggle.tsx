"use client";

import { useLayoutEffect } from "react";

let themeTransitionTimeout: number | undefined;

export function ThemeToggle() {
  useLayoutEffect(() => {
    try {
      document.documentElement.classList.toggle(
        "dark",
        localStorage.getItem("theorytester-theme") === "dark",
      );
    } catch {
      // The pre-hydration initializer also tolerates unavailable local storage.
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.add("theme-transition");
    root.classList.toggle("dark", nextIsDark);
    window.clearTimeout(themeTransitionTimeout);
    themeTransitionTimeout = window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 280);
    localStorage.setItem("theorytester-theme", nextIsDark ? "dark" : "light");
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label="Switch colour theme"
      title="Switch colour theme"
    >
      <span className="theme-toggle-icon" aria-hidden="true" />
      <span className="theme-toggle-label" aria-hidden="true" />
    </button>
  );
}
