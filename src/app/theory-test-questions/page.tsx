import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Irish Theory Test Questions 2026 | Answers & Explanations",
  description: "Browse Irish driving theory test questions with answers and explanations. Search the TheoryPrep library by topic.",
  alternates: { canonical: "/theory-test-questions" },
};

export default function TheoryTestQuestionsPage() {
  return <SeoLandingPage eyebrow="Question library" title="Irish Theory Test Questions" intro="Browse Irish driving theory test questions with answers and explanations. Search the TheoryPrep library, filter by topic and open any question for more detail." primaryAction={{ href: "/questions", label: "Browse questions", description: "" }} secondaryAction={{ href: "/theory-test-practice", label: "Start practising", description: "" }} canonicalPath="/theory-test-questions" sections={[
    { title: "Search the full library", body: "Use the question browser to search by phrase and move through the full TheoryPrep library in one place." },
    { title: "Filter by topic", body: "Browse areas including signs, vehicle condition, road positioning, road conditions, licensing, vehicle control and more." },
    { title: "Open the full explanation", body: "Each question page gives you the available answer choices, the correct answer and the explanation used by the practice experience." },
    { title: "Practise what you find", body: "From the library you can move directly into practice, mock tests or more questions instead of stopping after one result." },
  ]} sampleHeading="Questions you can open right now." sampleDescription="These are individual TheoryPrep question pages. Open one to see the complete answer and explanation." />;
}
