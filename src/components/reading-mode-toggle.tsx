"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theorytester-reading-mode";

export function ReadingModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isEnabled = document.documentElement.classList.contains("reading-mode");
    setEnabled(isEnabled);
  }, []);

  function toggleReadingMode() {
    const nextEnabled = !enabled;
    document.documentElement.classList.toggle("reading-mode", nextEnabled);
    localStorage.setItem(STORAGE_KEY, nextEnabled ? "on" : "off");
    setEnabled(nextEnabled);
  }

  return (
    <button
      className={"reading-mode-toggle" + (enabled ? " reading-mode-toggle-active" : "")}
      type="button"
      onClick={toggleReadingMode}
      aria-label={enabled ? "Turn off easier reading mode" : "Turn on easier reading mode"}
      aria-pressed={enabled}
      title={enabled ? "Turn off easier reading mode" : "Easier reading mode"}
    >
      <span className="reading-mode-icon" aria-hidden="true">Aa</span>
      <span className="reading-mode-label">Reading</span>
    </button>
  );
}
