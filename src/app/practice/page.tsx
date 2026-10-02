import type { Metadata } from "next";
import { PracticeSession } from "@/components/practice-session";

export const metadata: Metadata = {
  title: "Irish Theory Test Practice 2026 | Free Questions",
  description: "Practice Irish driving theory questions by topic, session length and mistakes with TheoryPrep in 2026.",
  alternates: { canonical: "/practice" },
};

export default function PracticePage() {
  return <PracticeSession />;
}
