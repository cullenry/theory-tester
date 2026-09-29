import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Irish Theory Test Practice",
  description: "Free Irish theory test practice with hundreds of questions, explanations, topic practice and full mock tests.",
  alternates: { canonical: "/theory-test-practice" },
};

export default function TheoryTestPracticePage() {
  return <SeoLandingPage eyebrow="Irish driving theory practice" title="Irish Theory Test Practice" intro="Practise Irish driving theory questions online with clear explanations, focused learning and full mock tests. Build confidence one question at a time." primaryAction={{ href: "/practice", label: "Start practising", description: "" }} secondaryAction={{ href: "/irish-theory-test-mock-test", label: "Take a mock test", description: "" }} sections={[
    { title: "Practise at your own pace", body: "Choose a quick session or a longer practice block, then work through questions without needing to repeat the same routine every time." },
    { title: "Learn from each answer", body: "Every question includes the answer and explanation so you can understand what to review rather than only seeing a score." },
    { title: "Focus on weak areas", body: "Signed-in learners can use saved progress, mistakes and adaptive practice to spend more time on topics that need attention." },
    { title: "Finish with a mock", body: "When you are ready to test yourself, switch from practice into a full 40-question mock and review your result afterwards." },
  ]} sampleHeading="Try real questions from the library." sampleDescription="Open individual questions to see the answers, explanations and supporting images where available." />;
}
