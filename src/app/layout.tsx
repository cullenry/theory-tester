import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const siteUrl = "https://theoryprep.irish";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "TheoryPrep | Irish Driving Theory Practice", template: "%s | TheoryPrep" },
  description: "Practise Irish driving theory questions, learn from explanations, take mock tests and prepare for test day.",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theorytester-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");var r=localStorage.getItem("theorytester-reading-mode");if(r==="on")document.documentElement.classList.add("reading-mode")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
