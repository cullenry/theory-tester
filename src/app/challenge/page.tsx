import type { Metadata } from "next";
import { DailyChallenge } from "@/components/daily-challenge";

export const metadata: Metadata = {
  title: "Daily Irish Theory Test Challenge",
  description: "Answer ten fresh Irish driving theory practice questions each day and keep your TheoryPrep streak moving.",
  alternates: { canonical: "/challenge" },
};

export default function ChallengePage() {
  return <DailyChallenge />;
}
