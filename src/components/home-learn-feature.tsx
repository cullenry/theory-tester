"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function HomeLearnFeature() {
  const supabase = useMemo(() => createClient(), []);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(Boolean(data.user));
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const heading = signedIn ? "Your personalised learning." : "Make practice personal.";
  const description = signedIn
    ? "Pick up where you left off and let Learn focus your next questions around the areas you need to reinforce."
    : "Sign in to unlock Learn mode, where your practice history helps shape what you see next.";

  return (
    <section className="learn-feature-card" aria-labelledby="learn-feature-title">
      <div className="learn-feature-copy">
        <p className="eyebrow">Personalised learning</p>
        <h2 id="learn-feature-title">{heading}</h2>
        <p>{description}</p>
        <div className="learn-feature-points" aria-hidden="true">
          <span>Weak spots</span>
          <span>Smart review</span>
          <span>Progress saved</span>
        </div>
      </div>
      <Link className="button button-primary learn-feature-action" href={signedIn ? "/practice/learn" : "/login?next=/practice/learn"}>
        {signedIn ? "Continue Learn" : "Sign in to Learn"}
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
