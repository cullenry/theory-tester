import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

export const metadata: Metadata = {
  title: "Irish Road Signs Theory Test 2026 | Practice",
  description: "Practise Irish road signs, signals and road markings questions with answers and explanations on TheoryPrep in 2026.",
  alternates: { canonical: "/irish-road-signs" },
};

export default function IrishRoadSignsPage() {
  return <SeoLandingPage eyebrow="Signs, signals and road markings" title="Irish Road Signs Theory Test" intro="Practise Irish road signs, signals and road markings questions with clear answers and explanations. Use focused practice when signs are the area you want to strengthen." primaryAction={{ href: "/practice?category=Signs%2C%20signals%20and%20road%20markings", label: "Practise road signs", description: "" }} secondaryAction={{ href: "/questions", label: "Browse all questions", description: "" }} canonicalPath="/irish-road-signs" questionCategory="Signs, signals and road markings" sections={[
    { title: "Practise the signs category", body: "Focus on the signs, signals and road markings section of the TheoryPrep library rather than mixing every topic together." },
    { title: "Use images where available", body: "Questions with supporting images let you practise visual recognition alongside the written answer choices." },
    { title: "Read the explanation", body: "After answering, use the explanation to reinforce what the sign, signal or road marking means in context." },
    { title: "Return to the full library", body: "When you are comfortable with road signs, move back to mixed practice or a full mock test to broaden your preparation." },
  ]} sampleHeading="Road-sign questions from the library." sampleDescription="These examples come from TheoryPrep's signs, signals and road markings category." />;
}
