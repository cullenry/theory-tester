"use client";

import { useState } from "react";
import { shareText } from "@/lib/challenge-share";

type ShareResultButtonProps = {
  text: string;
  url?: string;
  title?: string;
};

export function ShareResultButton({
  text,
  url = typeof window !== "undefined" ? window.location.origin : "https://theoryprep.irish",
  title = "TheoryPrep result",
}: ShareResultButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "failed">("idle");

  async function handleShare() {
    setStatus("idle");
    const result = await shareText({ title, text, url });
    setStatus(result);
    if (result !== "failed") {
      window.setTimeout(() => setStatus("idle"), 2200);
    }
  }

  return (
    <button className="button button-secondary" type="button" onClick={handleShare}>
      {status === "copied" ? "Copied — share it!" : status === "failed" ? "Try sharing again" : "Share result"}{" "}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
