"use client";

import { useEffect } from "react";
import { flushOfflineAttempts } from "@/lib/progress";

function isMobileTarget() {
  return window.matchMedia("(max-width: 1024px)").matches &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
}

export function MobilePwaManager() {
  useEffect(() => {
    if (!isMobileTarget() || !("serviceWorker" in navigator)) return;

    let active = true;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (active) await flushOfflineAttempts();
      } catch (error) {
        console.warn("Could not register the TheoryPrep mobile service worker:", error);
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });

    const handleOnline = () => {
      void flushOfflineAttempts();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.removeEventListener("load", register);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
