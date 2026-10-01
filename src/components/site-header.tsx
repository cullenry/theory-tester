"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/mock-test", label: "Mock test" },
  { href: "/practice", label: "Practice" },
  { href: "/practice/learn", label: "Learn" },
];

const moreNavigation = [
  { href: "/questions", label: "Question library", description: "Browse all 805 questions" },
  { href: "/theory-test-topics", label: "Topics", description: "Study one area at a time" },
  { href: "/practice/flashcards", label: "Flashcards", description: "Use active recall to revise" },
  { href: "/mistakes", label: "My mistakes", description: "Review questions you missed" },
  { href: "/progress", label: "My progress", description: "See your scores and history" },
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (!accountOpen && !moreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const accountMenu = document.querySelector(".account-menu");
      const desktopMoreMenu = document.querySelector(".desktop-more-menu");
      if (accountMenu && !accountMenu.contains(target)) setAccountOpen(false);
      if (desktopMoreMenu && !desktopMoreMenu.contains(target)) setMoreOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen, moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

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
            className="brand-logo"
            src={isDarkTheme ? "/images/theoryprep-logo-dark.png" : "/images/theoryprep-logo.png"}
            alt="TheoryPrep"
            width={108}
            height={65}
            priority
          />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              className="nav-link"
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}

          <div className="desktop-more-menu">
            <button
              className={moreOpen ? "nav-link nav-more-trigger nav-more-trigger-open" : "nav-link nav-more-trigger"}
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => {
                setMoreOpen((open) => !open);
                setAccountOpen(false);
              }}
            >
              More <span className={moreOpen ? "nav-more-chevron nav-more-chevron-open" : "nav-more-chevron"} aria-hidden="true" />
            </button>

            {moreOpen && (
              <div className="desktop-more-popover" role="menu">
                <div className="desktop-more-heading">
                  <p className="eyebrow">More ways to study</p>
                  <span>Pick up where you left off.</span>
                </div>
                {moreNavigation.map((item) => (
                  <Link
                    key={item.href}
                    className="desktop-more-item"
                    href={item.href}
                    role="menuitem"
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="header-actions">
          {userName ? (
            <div className="account-menu">
              <button
                className="account-trigger"
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setAccountOpen((open) => !open);
                  setMoreOpen(false);
                }}
              >
                <span className="account-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
                <span className="account-name">{userName}</span>
                <span className={accountOpen ? "account-chevron account-chevron-open" : "account-chevron"} aria-hidden="true" />
              </button>

              {accountOpen && (
                <div className="account-popover" role="menu">
                  <div className="account-popover-label">Signed in</div>
                  <Link className="account-progress-link" href="/progress" role="menuitem">View my progress <span aria-hidden="true">↗</span></Link>
                  <Link className="account-settings-link" href="/settings" role="menuitem">Settings <span aria-hidden="true">⚙</span></Link>
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
