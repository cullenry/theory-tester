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
  title: { default: "Irish Driving Theory Test 2026 | TheoryPrep", template: "%s | TheoryPrep" },
  description:
    "Practise 805 Irish driving theory questions for 2026, take realistic mock tests, study clear explanations and track your progress online — free with TheoryPrep.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Irish Driving Theory Test 2026 | TheoryPrep",
    description:
      "Practise 805 Irish driving theory questions for 2026. Take realistic mock tests, study clear explanations and track your progress.",
    url: siteUrl,
    siteName: "TheoryPrep",
    locale: "en_IE",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TheoryPrep — Irish Driving Theory Test 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "Irish Driving Theory Test 2026 | TheoryPrep",
    description:
      "Practise 805 Irish driving theory questions for 2026, plus mock tests and clear explanations.",
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "TheoryPrep", statusBarStyle: "default" },
  icons: {
    icon: [
      {
        url: "/icons/theoryprep-book.png",
        type: "image/png",
        sizes: "48x48",
      },
    ],
    apple: [{ url: "/icons/theoryprep-bookOld.png", sizes: "180x180", type: "image/png" }],
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
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <MobileBottomNav />
        <PwaInstallPrompt />
        <MobilePwaManager />
        <AppLaunchSplash />
        <Analytics />
        <Script
          id="theoryprep-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theorytester-theme");var d=t==="dark";if(d)document.documentElement.classList.add("dark");var r=localStorage.getItem("theorytester-reading-mode");if(r==="on")document.documentElement.classList.add("reading-mode")}catch(e){}})()`,
          }}
        />
      </body>
    </html>
  );
}
