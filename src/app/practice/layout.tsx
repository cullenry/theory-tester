import type { Metadata } from "next";

export const metadata: Metadata = { title: "Practice", description: "Practise Irish driving theory questions with instant feedback and explanations." };

export default function PracticeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}