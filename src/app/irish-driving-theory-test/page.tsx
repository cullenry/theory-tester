import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Irish Driving Theory Test",
  description: "Prepare for the Irish driving theory test with TheoryPrep: questions, explanations, topic practice and mock tests.",
  alternates: { canonical: "/irish-driving-theory-test" },
};

export default function IrishDrivingTheoryTestPage() {
  return <SeoLandingPage eyebrow="Prepare with TheoryPrep" title="Irish Driving Theory Test" intro="Get ready for the Irish driving theory test with a practical online study resource built around repeated question practice, explanations and mock tests." primaryAction={{ href: "/theory-test-practice", label: "Practise the questions", description: "" }} secondaryAction={{ href: "/questions", label: "Browse the library", description: "" }} sections={[
    { title: "One library, many ways to study", body: "TheoryPrep brings the question bank together with search, category browsing, practice sessions, daily challenges and mock tests." },
    { title: "Use explanations as you learn", body: "After each answer, you can read the explanation and then continue practising instead of leaving the topic behind." },
    { title: "Track your preparation", body: "Create an account to keep question history, mistakes, starred questions, streaks and mock-test results in one place." },
    { title: "Independent and focused", body: "TheoryPrep is an independent study resource based on official RSA material. It is designed for practice rather than replacing the official test service." },
  ]} sampleHeading="Explore the question bank." sampleDescription="The public library lets you search the full set of TheoryPrep questions without creating an account." />;
}
