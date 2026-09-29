import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Irish Theory Test Mock Test",
  description: "Take a full Irish theory test mock with 40 questions, timed practice and detailed answer review.",
  alternates: { canonical: "/irish-theory-test-mock-test" },
};

export default function IrishTheoryTestMockTestPage() {
  return <SeoLandingPage eyebrow="Test yourself" title="Irish Theory Test Mock Test" intro="Put your preparation under pressure with a full 40-question TheoryPrep mock test. Review your answers afterwards and use the result to guide your next study session." primaryAction={{ href: "/mock-test", label: "Take a mock test", description: "" }} secondaryAction={{ href: "/theory-test-practice", label: "Practise first", description: "" }} sections={[
    { title: "A full 40-question session", body: "Use the full mock format when you want a longer test-style session rather than a short practice burst." },
    { title: "Keep an eye on the clock", body: "The full mock is timed so you can practise answering questions while keeping track of your remaining time." },
    { title: "Review the result", body: "Once you finish, review the questions you got right and wrong and jump straight back into practice where needed." },
    { title: "Turn mistakes into practice", body: "Mistakes are useful study signals. Use your results and review tools to decide what to practise next." },
  ]} sampleHeading="See the questions behind the mock." sampleDescription="The same public question library is available whenever you want to inspect individual questions more closely." />;
}
