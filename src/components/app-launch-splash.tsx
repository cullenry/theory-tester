"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser-only state initialization is intentionally performed after hydration. */

import Image from "next/image";
import { useEffect, useState } from "react";

export function AppLaunchSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1024px)").matches &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (!mobile || !standalone) return;

    try {
      if (sessionStorage.getItem("theoryprep-app-splash-seen") === "1") return;
      sessionStorage.setItem("theoryprep-app-splash-seen", "1");
    } catch {
      // Continue without persistence if session storage is unavailable.
    }

    setVisible(true);

    const hide = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(hide);
  }, []);

  if (!visible) return null;

  return (
    <div className="app-launch-splash" aria-hidden="true">
      <Image src="/icons/theoryprep-bookOld.png" alt="" width={86} height={86} priority />
      <span>TheoryPrep</span>
    </div>
  );
}
