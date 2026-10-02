import Image from "next/image";
import type { Metadata } from "next";
import { QuestionBrowser } from "@/components/question-browser";
import { questions } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Irish Theory Test Questions 2026 | Answers & Explanations",
  description: "Search and browse Irish driving theory test questions by topic with answers and explanations on TheoryPrep.",
  alternates: { canonical: "/questions" },
};

export default function QuestionsPage() {
  return (
    <main className="app-main">
      <div className="page-shell browser-shell">
        <div className="page-heading">
          <div><h1>Question browser</h1></div>
          <span className="test-chip">{questions.length} questions</span>
        </div>
        <section className="library-intro" aria-labelledby="library-intro-title">
          <div className="library-intro-copy">
            <h2 id="library-intro-title">The whole road, in one place.</h2>
            <p>Search all {questions.length} questions, browse by topic and open any question for the answer and explanation.</p>
          </div>
          <div className="library-intro-art">
            <Image
              src="/images/theorytester-driving-theory.png"
              alt="Illustration of an Irish driving theory book, road signs and a practice checklist"
              width={748}
              height={460}
              sizes="(max-width: 760px) 100vw, 430px"
            />
          </div>
        </section>
        <QuestionBrowser />
      </div>
    </main>
  );
}