import type { Metadata } from "next";
import { MockTestSession } from "@/components/mock-test-session";
import { getRandomQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Irish Theory Test Mock Test",
  description: "Take a timed 40-question Irish theory test mock and review your answers with TheoryPrep.",
  alternates: { canonical: "/mock-test" },
};

type MockTestPageProps = {
  searchParams: Promise<{ debugTimer?: string | string[] }>;
};

export default async function MockTestPage({ searchParams }: MockTestPageProps) {
  const { debugTimer } = await searchParams;
  const debugTimerEnabled = process.env.NODE_ENV !== "production" && debugTimer === "1";
  return <MockTestSession initialQuestions={getRandomQuestions(40)} initialDurationSeconds={debugTimerEnabled ? 5 : 40 * 60} debugTimerEnabled={debugTimerEnabled} />;
}
