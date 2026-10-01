"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/practice", label: "Practice", icon: "learn" },
  { href: "/mock-test", label: "Mock", icon: "mock" },
  { href: "/practice/learn", label: "Learn", icon: "learn" },
] as const;

const moreItems = [
  { href: "/questions", label: "Question library", description: "Browse all 805 questions", icon: "questions" },
  { href: "/theory-test-topics", label: "Topics", description: "Study one area at a time", icon: "topics" },
  { href: "/practice/flashcards", label: "Flashcards", description: "Revise with active recall", icon: "flashcards" },
  { href: "/mistakes", label: "My mistakes", description: "Review questions you missed", icon: "mistakes" },
  { href: "/progress", label: "My progress", description: "See your scores and history", icon: "progress" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  if (href === "/practice") {
    return pathname === "/practice";
  }

  if (href === "/mock-test") {
    return pathname === "/mock-test" || pathname.startsWith("/irish-theory-test-mock-test");
  }

  if (href === "/practice/learn") {
    return pathname === "/practice/learn" || pathname.startsWith("/practice/learn/lesson");
  }

  return pathname === href || pathname.startsWith(href + "/");
}

function isMoreActive(pathname: string) {
  return moreItems.some((item) =>
    pathname === item.href || pathname.startsWith(item.href + "/")
  ) || pathname.startsWith("/theory-test-questions") || pathname.startsWith("/irish-road-signs");
}

function Icon({ name }: { name: "home" | "learn" | "mock" | "questions" | "topics" | "flashcards" | "mistakes" | "progress" }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 10.5 12 3.8l8.5 6.7" />
        <path d="M5.5 9.7v10.1h13V9.7" />
        <path d="M9.4 19.8v-5.6h5.2v5.6" />
      </svg>
    );
  }

  if (name === "learn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 6.2c2.5-1.3 5-.9 7.5.7v12.1c-2.5-1.6-5-2-7.5-.7z" />
        <path d="M19.5 6.2c-2.5-1.3-5-.9-7.5.7v12.1c-2.5-1.6-5-.9-7.5-.7z" />
        <path d="M12 8.1v9.8M9.2 11.5h.01M14.8 11.5h.01M9.2 14.8h.01M14.8 14.8h.01" />
      </svg>
    );
  }

  if (name === "mock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5.2" y="4.3" width="13.6" height="15.4" rx="2.6" />
        <path d="M9 4.3v-1h6v1M8.4 8.6h7.2M8.4 12h7.2M8.4 15.4h4.1" />
      </svg>
    );
  }

  if (name === "questions") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5.7" cy="6.2" r="1.5" />
        <circle cx="5.7" cy="12" r="1.5" />
        <circle cx="5.7" cy="17.8" r="1.5" />
        <path d="M9.3 6.2h9M9.3 12h9M9.3 17.8h9" />
      </svg>
    );
  }

  if (name === "topics") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7.5h14M5 12h14M5 16.5h9" />
        <circle cx="7" cy="7.5" r="1.2" />
        <circle cx="17" cy="12" r="1.2" />
        <circle cx="7" cy="16.5" r="1.2" />
      </svg>
    );
  }

  if (name === "flashcards") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5.5" y="6" width="13" height="10" rx="2" />
        <path d="M8.5 10h5M8.5 13h3.5M8 17.5h10.5" />
      </svg>
    );
  }

  if (name === "mistakes") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.2 20 18H4z" />
        <path d="M12 9v4.7M12 16.7h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4v4.9l3.1 2M12 3.4v1.3M12 19.3v1.3" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = isMoreActive(pathname);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {moreOpen && (
        <button
          className="mobile-more-backdrop"
          type="button"
          aria-label="Close more options"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="mobile-more-panel" role="menu" aria-label="More ways to study">
          <div className="mobile-more-heading">
            <div>
              <p className="eyebrow">More ways to study</p>
              <strong>Choose another tool</strong>
            </div>
            <button className="mobile-more-close" type="button" aria-label="Close more options" onClick={() => setMoreOpen(false)}>×</button>
          </div>
          <div className="mobile-more-grid">
            {moreItems.map((item) => (
              <Link key={item.href} className="mobile-more-item" href={item.href} role="menuitem">
                <span className="mobile-more-item-icon"><Icon name={item.icon} /></span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="mobile-more-item-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav-inner">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={active ? "mobile-nav-item mobile-nav-item-active" : "mobile-nav-item"}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          className={moreActive || moreOpen ? "mobile-nav-item mobile-nav-more mobile-nav-item-active" : "mobile-nav-item mobile-nav-more"}
          type="button"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="mobile-nav-icon">
            <span className="mobile-more-dots" aria-hidden="true"><i /><i /><i /></span>
          </span>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
