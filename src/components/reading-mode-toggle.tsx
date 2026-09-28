"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theorytester-reading-mode";

export function ReadingModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncState = () => setEnabled(document.documentElement.classList.contains("reading-mode"));
    syncState();
  }, []);

  function toggleReadingMode() {
    const nextEnabled = !document.documentElement.classList.contains("reading-mode");
    document.documentElement.classList.toggle("reading-mode", nextEnabled);
    try {
      localStorage.setItem(STORAGE_KEY, nextEnabled ? "on" : "off");
    } catch {
      // The visual preference still works when storage is unavailable.
    }
    setEnabled(nextEnabled);
  }

  return (
    <button
      className={"reading-mode-toggle reading-mode-toggle-inline" + (enabled ? " reading-mode-toggle-active" : "")}
      type="button"
      onClick={toggleReadingMode}
      aria-label={enabled ? "Turn off easier reading mode" : "Turn on easier reading mode"}
      aria-pressed={enabled}
      title={enabled ? "Turn off easier reading mode" : "Easier reading mode"}
    >
      <span className="reading-mode-icon" aria-hidden="true">Aa</span>
      <span className="reading-mode-label">Easier reading</span>
    </button>
  );
}
