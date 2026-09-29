"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "theoryprep-pwa-install-dismissed-until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (isStandalone) return;

    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
      if (dismissedUntil > Date.now()) return;
    } catch {
      // Installation UI is an enhancement; continue without persistence.
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installEvent || hidden) return null;

  async function handleInstall() {
    const event = installEvent;
    setInstallEvent(null);

    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // The browser owns the native prompt. Nothing else is required here.
    }
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      // Ignore storage failures.
    }
    setInstallEvent(null);
    setHidden(true);
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install TheoryPrep">
      <div className="pwa-install-icon" aria-hidden="true">
        <span> T </span>
      </div>
      <div className="pwa-install-copy">
        <strong>Install TheoryPrep</strong>
        <span>Keep your theory practice one tap away on your home screen.</span>
      </div>
      <div className="pwa-install-actions">
        <button className="pwa-install-button" type="button" onClick={handleInstall}>
          Install
        </button>
        <button className="pwa-install-dismiss" type="button" onClick={handleDismiss} aria-label="Dismiss install prompt">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
