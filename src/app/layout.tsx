import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Theory Tester",
  description: "Practice for your driving theory test.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
