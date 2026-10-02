"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser-only state initialization is intentionally performed after hydration. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  House,
  Layers,
  List,
  ListChecks,
  Tags,
  TriangleAlert,
} from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/mock-test", label: "Mock", icon: "mock" },
  { href: "/practice", label: "Practice", icon: "practice" },
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

const icons = {
  home: House,
  mock: ClipboardList,
  practice: ListChecks,
  learn: BookOpen,
  questions: List,
  topics: Tags,
  flashcards: Layers,
  mistakes: TriangleAlert,
  progress: ChartNoAxesColumnIncreasing,
};

function Icon({ name }: { name: keyof typeof icons }) {
  const IconComponent = icons[name];
  return <IconComponent aria-hidden="true" strokeWidth={1.75} />;
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
