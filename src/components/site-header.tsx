import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-test", label: "Mock test" },
  { href: "/questions", label: "Questions" },
  { href: "https://ryan-portfolio-qd24ddmsb-cullenry.vercel.app/", label: "Contact me", external: true },
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
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}