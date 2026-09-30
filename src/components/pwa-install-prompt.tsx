"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "theoryprep-pwa-install-dismissed-until";
const DISMISS_MS = 5 * 60 * 1000;

const BLOCKED_PATHS = [
  "/mock-test",
  "/challenge",
  "/challenge/",
  "/practice/learn",
  "/offline-practice",
  "/practice/flashcards",
];

function isTestingPath(pathname: string) {
  return BLOCKED_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileTarget() {
  return window.matchMedia("(max-width: 1024px)").matches &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const isTesting = isTestingPath(pathname);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosInstallable, setIosInstallable] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isMobileTarget()) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (standalone) return;

    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
      if (dismissedUntil > Date.now()) {
        setHidden(true);
        return;
      }
    } catch {
      // Installation UI is an optional enhancement.
    }

    const ios = isIos();

    if (ios) {
      const timer = window.setTimeout(() => setIosInstallable(true), 8000);
      return () => window.clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIosInstallable(false);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (hidden || isTesting || (!installEvent && !iosInstallable)) return null;

  async function handleInstall() {
    if (!installEvent) {
      setInstructionsOpen(true);
      return;
    }

    const event = installEvent;
    setInstallEvent(null);

    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // The browser owns the native install dialog.
    }
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      // Ignore storage failures.
    }
    setInstallEvent(null);
    setIosInstallable(false);
    setInstructionsOpen(false);
    setHidden(true);
  }

  return (
    <>
      <aside className="pwa-install-prompt" aria-label="Install TheoryPrep">
        <div className="pwa-install-icon" aria-hidden="true"><Image src="/icons/theoryprep-bookOld.png" alt="" width={42} height={42} /></div>
        <div className="pwa-install-copy">
          <strong>Add TheoryPrep to your Home Screen</strong>
          <span>{iosInstallable ? "Use the Share button, then choose Add to Home Screen." : "Keep your theory practice one tap away."}</span>
        </div>
        <div className="pwa-install-actions">
          <button className="pwa-install-button" type="button" onClick={handleInstall}>
            {iosInstallable ? "How to" : "Install"}
          </button>
          <button className="pwa-install-dismiss" type="button" onClick={handleDismiss} aria-label="Dismiss install prompt">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </aside>

      {instructionsOpen && iosInstallable && (
        <div className="ios-install-sheet" role="dialog" aria-modal="true" aria-labelledby="ios-install-title">
          <div className="ios-install-sheet-panel">
            <button className="ios-install-sheet-close" type="button" onClick={() => setInstructionsOpen(false)} aria-label="Close">×</button>
            <p className="eyebrow">iPhone / iPad</p>
            <h2 id="ios-install-title">Put TheoryPrep on your Home Screen.</h2>
            <div className="ios-install-steps">
              <div><span>01</span><strong>Tap Share</strong><small>Use the Share button in Safari.</small></div>
              <div><span>02</span><strong>Add to Home Screen</strong><small>Scroll the Share menu until you see it.</small></div>
              <div><span>03</span><strong>Tap Add</strong><small>TheoryPrep will open like an app from your Home Screen.</small></div>
            </div>
            <button className="button button-primary" type="button" onClick={() => setInstructionsOpen(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
