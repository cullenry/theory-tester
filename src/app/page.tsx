import Image from "next/image";
import Link from "next/link";
import { questions } from "@/lib/questions";
import { HomeStreakWidget } from "@/components/home-streak-widget";
import { DailyMission } from "@/components/daily-mission";
import { HomeExamCountdown } from "@/components/home-exam-countdown";
import { HomeProofWidget } from "@/components/home-proof-widget";

const modes = [
  { number: "01", title: "Learn & Practice", description: "Learn from the ground up, target weak spots and practise questions at your own pace.", href: "/practice", action: "Open Learn & Practice" },
  { number: "02", title: "Mock test", description: "Take a timed 40-question car theory test, then review every answer when you finish.", href: "/mock-test", action: "Take the mock test" },
  { number: "03", title: "Question library", description: "Browse all 805 questions, search by phrase, filter by topic and save questions for later.", href: "/questions", action: "Browse 805 questions" },
  { number: "04", title: "Flashcards", description: "Flip through questions, reveal the answer and reinforce the ones worth remembering.", href: "/practice/flashcards", action: "Study with flashcards" },
];

export default function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="live-dot" /> Free Irish car theory test practice</p>
            <h1>Get ready for your<br /><span className="hero-irish-text" data-text="Irish car theory test.">Irish car theory test.</span></h1>
            <p className="hero-description">Practise 805 Irish car theory questions, learn from clear explanations and take timed mock tests — all in your browser. Category B (BW) is the car theory test.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/practice">Start free practice <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/mock-test">Take a mock test</Link>
            </div>
            <div className="hero-proof">
              <strong>{questions.length}</strong><span>practice questions</span><span className="proof-separator" /><strong>40</strong><span>questions in a mock</span><span className="proof-separator" /><span>Free to start</span>
            </div>
