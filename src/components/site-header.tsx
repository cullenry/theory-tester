"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Learn & Practice" },
  { href: "/mock-test", label: "Mock test" },
  { href: "/questions", label: "Questions" },
  { href: "/progress", label: "My Progress" },
];

function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : "";

  if (metadataName) return metadataName;

  const emailName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!emailName) return "Account";

  return emailName.split(" ").filter(Boolean).map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(" ");
}

export function SiteHeader() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!accountOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const menu = document.querySelector(".account-menu");
      if (menu && !menu.contains(target)) setAccountOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserName(data.user ? getDisplayName(data.user) : null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUserName(null);
        setAccountOpen(false);
      } else {
        setUserName(getDisplayName(session.user));
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
  }

  return (
    <header className="site-header site-header-responsive">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="TheoryPrep home">
          <Image
            className="brand-logo brand-logo-light"
            src="/images/theoryprep-logo.png"
            alt="TheoryPrep"
            width={108}
            height={65}
            priority
          />
          <Image
            className="brand-logo brand-logo-dark"
            src="/images/theoryprep-logo-dark.png"
            alt="TheoryPrep"
            width={108}
            height={65}
            priority
          />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              className={item.href === "/progress" ? "nav-link nav-progress-link" : "nav-link"}
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {userName ? (
            <div className="account-menu">
              <button
                className="account-trigger"
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="account-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
                <span className="account-name">{userName}</span>
                <span className={accountOpen ? "account-chevron account-chevron-open" : "account-chevron"} aria-hidden="true" />
              </button>

              {accountOpen && (
                <div className="account-popover" role="menu">
                  <div className="account-popover-label">Signed in</div>
                  <Link className="account-progress-link" href="/progress" role="menuitem">View my progress <span aria-hidden="true">↗</span></Link>
                  <button
                    className="account-signout"
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="nav-link nav-sign-in" href="/login">Sign in</Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
