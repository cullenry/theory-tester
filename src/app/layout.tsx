import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://theoryprep.irish";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Category A & B Theory Test Practice", template: "%s | TheoryPrep" },
  description: "Practise 805 Category A & B theory test questions, learn from clear explanations and take timed mock tests. Free to start with TheoryPrep.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TheoryPrep | Irish Driving Theory Practice",
    description: "Learn, practise and prepare for the Irish driving theory test.",
    url: siteUrl,
    siteName: "TheoryPrep",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Script
          id="theoryprep-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theorytester-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");var r=localStorage.getItem("theorytester-reading-mode");if(r==="on")document.documentElement.classList.add("reading-mode")}catch(e){}})()`,
          }}
        />
      </body>
    </html>
  );
}
