import type { Metadata } from "next";
import { MockTestSession } from "@/components/mock-test-session";
import { getRandomQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Irish Car Theory Test Mock Test",
  description: "Take a 40-question Category B (BW) car theory test mock with a 45-minute timer and review every answer with TheoryPrep.",
  alternates: { canonical: "/mock-test" },
};

type MockTestPageProps = {
  searchParams: Promise<{ debugTimer?: string | string[] }>;
};

export default async function MockTestPage({ searchParams }: MockTestPageProps) {
  const { debugTimer } = await searchParams;
  const debugTimerEnabled = process.env.NODE_ENV !== "production" && debugTimer === "1";
  return <MockTestSession initialQuestions={getRandomQuestions(40)} initialDurationSeconds={debugTimerEnabled ? 5 : 45 * 60} debugTimerEnabled={debugTimerEnabled} />;
}
