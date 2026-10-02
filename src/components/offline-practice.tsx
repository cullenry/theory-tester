"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnswerOption, ExplanationCard, QuestionCard } from "@/components/question-ui";
import { CompletionScoreGauge } from "@/components/completion-score-gauge";
import { questions, type Question } from "@/lib/questions";
import { recordQuestionAttempt } from "@/lib/progress";

function getOfflineSet() {
  const copy = [...questions];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, 10);
}

export function OfflinePractice() {
  const [set] = useState<Question[]>(() => getOfflineSet());
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const current = set[position];

  function answer(answer: string) {
    if (!current || selected !== null) return;
    const isCorrect = answer === current.correctAnswer;
    setSelected(answer);
    if (isCorrect) setCorrect((value) => value + 1);
    void recordQuestionAttempt(current, answer, isCorrect, "practice");
  }

  function next() {
    if (position + 1 >= set.length) {
      setDone(true);
      return;
    }
    setPosition((value) => value + 1);
    setSelected(null);
  }

  if (done) {
    return (
      <main className="app-main mobile-offline-only">
        <div className="page-shell practice-shell">
          <section className="course-complete-card">
            <p className="eyebrow">Offline session complete</p>
            <CompletionScoreGauge percentage={Math.round((correct / Math.max(1, set.length)) * 100)} label="Offline practice accuracy" />
            <h1>{correct}/{set.length} correct.</h1>
            <p>Your answers were kept on this device. When you reconnect, TheoryPrep will try to save them to your account.</p>
            <div className="course-complete-actions">
              <button className="button button-primary" type="button" onClick={() => window.location.reload()}>Try another set <span aria-hidden="true">↻</span></button>
              <Link className="button button-secondary" href="/practice">Back to practice</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main mobile-offline-only">
      <div className="page-shell practice-shell course-lesson-shell">
        <div className="page-heading course-lesson-heading">
          <div>
            <p className="eyebrow">Offline practice</p>
            <h1>Quick 10</h1>
            <p className="course-lesson-subtitle">No connection needed · answers queue for sync</p>
          </div>
          <Link className="button button-secondary" href="/practice">Exit</Link>
        </div>

        <div className="course-lesson-badge">
          <span>● On-device study</span>
          <small>Your question bank is available from this app session.</small>
        </div>

        <QuestionCard question={current} eyebrow={`Offline question ${position + 1} of ${set.length}`}>
          {current.answers.map((answerOption, index) => (
            <AnswerOption
              key={current.id + "-" + index}
              answer={answerOption}
              index={index}
              selected={selected === answerOption}
              disabled={selected !== null}
              correct={selected !== null && answerOption === current.correctAnswer}
              incorrect={selected === answerOption && answerOption !== current.correctAnswer}
              onSelect={() => answer(answerOption)}
            />
          ))}
        </QuestionCard>

        {selected !== null && (
          <div className="feedback-block">
            <p className={`feedback-line ${selected === current.correctAnswer ? "feedback-good" : "feedback-bad"}`} role="status">
              <strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong>
            </p>
            <ExplanationCard explanation={current.explanation} />
            <button className="button button-primary continue-button" type="button" onClick={next}>
              {position + 1 === set.length ? "Finish" : "Next question"} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
