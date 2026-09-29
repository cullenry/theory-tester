"use client";

import { useEffect, useState } from "react";
import { getTestCompletionCount } from "@/lib/progress";

export function HomeProofWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    getTestCompletionCount().then((value) => {
      if (mounted) setCount(value);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="home-proof-widget" aria-label="TheoryPrep practice activity">
      <strong>{count === null ? "—" : count.toLocaleString("en-IE")}</strong>
      <span>practice tests completed so far</span>
    </section>
  );
}
