import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-test", label: "Mock test" },
  { href: "/questions", label: "Questions" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="TheoryTester home">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>Theory<span className="brand-accent">Tester</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              className="nav-link"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="nav-link nav-sign-in" href="/login">Sign in</Link>
        <ThemeToggle />
      </div>
    </header>
  );
}