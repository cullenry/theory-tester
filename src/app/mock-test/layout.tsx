import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mock Test", description: "Take a 40-question Irish driving theory mock test and review your answers." };

export default function MockTestLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}