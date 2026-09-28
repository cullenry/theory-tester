import Image from "next/image";
import type { Metadata } from "next";
import { QuestionBrowser } from "@/components/question-browser";
import { questions } from "@/lib/questions";

export const metadata: Metadata = { title: "Question Library", description: "Search and browse Irish driving theory test questions by category." };

export default function QuestionsPage() {
  return (
    <main className="app-main">
      <div className="page-shell browser-shell">
        <div className="page-heading">
          <div><p className="eyebrow">The full library</p><h1>Question browser</h1></div>
          <span className="test-chip">{questions.length} questions</span>
        </div>
        <section className="library-intro" aria-labelledby="library-intro-title">
          <div className="library-intro-copy">
            <p className="eyebrow">Know what you&apos;re learning</p>
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