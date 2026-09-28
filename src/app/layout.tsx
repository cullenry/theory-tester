import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TheoryTester | Irish Driving Theory Practice", template: "%s | TheoryTester" },
  description: "Practise Irish driving theory questions, take a mock test and build confidence for test day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><SiteHeader />{children}</body>
    </html>
  );
}
