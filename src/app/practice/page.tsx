import type { Metadata } from "next";
import { PracticeSession } from "@/components/practice-session";

export const metadata: Metadata = {
  title: "Irish Theory Test Practice",
  description: "Practise Irish driving theory questions by topic, session length and mistakes with TheoryPrep.",
  alternates: { canonical: "/practice" },
};

export default function PracticePage() {
  return <PracticeSession />;
}
