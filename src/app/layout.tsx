import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { MobilePwaManager } from "@/components/mobile-pwa-manager";
import { AppLaunchSplash } from "@/components/app-launch-splash";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://theoryprep.irish";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "TheoryPrep",
  title: {
    default: "Irish Theory Test Practice 2026 | TheoryPrep",
    template: "%s | TheoryPrep",
  },
  description:
    "Free Irish theory test practice with 805+ questions, mock tests, flashcards and clear explanations. Prepare for your Irish Driver Theory Test online.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Irish Theory Test Practice 2026 | TheoryPrep",
    description:
      "Free Irish theory test practice with questions, mock tests, flashcards and clear explanations.",
    url: siteUrl,
    siteName: "TheoryPrep",
    locale: "en_IE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Irish Theory Test Practice 2026 | TheoryPrep",
    description:
      "Free Irish theory test practice with questions, mock tests and flashcards.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "TheoryPrep",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16704c",
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
        <MobileBottomNav />
        <PwaInstallPrompt />
        <MobilePwaManager />
        <AppLaunchSplash />
        <Analytics />
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
