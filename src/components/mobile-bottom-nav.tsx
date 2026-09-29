"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/practice", label: "Practice", icon: "practice" },
  { href: "/mock-test", label: "Mock", icon: "mock" },
  { href: "/questions", label: "Questions", icon: "questions" },
  { href: "/progress", label: "Progress", icon: "progress" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name }: { name: (typeof items)[number]["icon"] }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 10.5 12 3.8l8.5 6.7" />
        <path d="M5.5 9.7v10.1h13V9.7" />
        <path d="M9.4 19.8v-5.6h5.2v5.6" />
      </svg>
    );
  }

  if (name === "practice") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.2 4.8h9.6a2.2 2.2 0 0 1 2.2 2.2v12.2H8.3a2.8 2.8 0 0 1-2.8-2.8V7.6a2.8 2.8 0 0 1 2.8-2.8Z" />
        <path d="M8.2 4.8v14.4M10.7 9h4.7M10.7 12.4h4.7" />
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

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4v4.9l3.1 2M12 3.4v1.3M12 19.3v1.3" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
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
      </div>
    </nav>
  );
}
