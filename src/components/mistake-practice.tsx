"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { questions, type Question } from "@/lib/questions";
import { getMistakeQuestionIds, recordQuestionAttempt } from "@/lib/progress";

type SessionSize = 10 | 20 | "all";

function shuffleQuestions(items: Question[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getSessionCount(size: SessionSize, total: number) {
  if (size === "all") return total;
  return Math.min(size, total);
}

export function MistakePractice() {
  const [mistakes, setMistakes] = useState<Question[] | null>(null);
  const [session, setSession] = useState<Question[] | null>(null);
  const [sessionSize, setSessionSize] = useState<SessionSize>(10);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    getMistakeQuestionIds().then((ids) => {
      setMistakes(
        ids
          .map((id) => questions.find((question) => question.id === id))
          .filter((question): question is Question => Boolean(question)),
      );
    });
  }, []);

  const categoryGroups = useMemo(() => {
    if (!mistakes) return [];

    const groups = new Map<string, Question[]>();

    for (const question of mistakes) {
      const category =
        question.taxonomy.category?.trim() ||
        question.category?.trim() ||
        "General";

      const existing = groups.get(category) ?? [];
      existing.push(question);
      groups.set(category, existing);
    }

    return [...groups.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "en"),
    );
  }, [mistakes]);

  function start(size: SessionSize = sessionSize) {
    if (!mistakes?.length) return;

    const count = getSessionCount(size, mistakes.length);
    setSession(shuffleQuestions(mistakes).slice(0, count));
    setSessionSize(size);
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
  }

  if (mistakes === null) {
    return (
      <main className="app-main">
        <div className="page-shell progress-shell">
          <div className="progress-loading">Loading your saved mistakes…</div>
        </div>
      </main>
    );
  }

  if (!mistakes.length) {
    return (
      <main className="app-main">
        <div className="page-shell progress-shell">
          <section className="empty-state progress-login-state">
            <p className="eyebrow">Personalised practice</p>
            <h1>Nothing to revisit yet.</h1>
            <p>
              Answer some practice or mock-test questions first. When you miss a question,
              it will appear here.
            </p>
            <div className="progress-cta-row">
              <Link className="button button-primary" href="/practice">
                Start practising <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/progress">My progress</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (session === null) {
    const selectedCount = getSessionCount(sessionSize, mistakes.length);

    return (
      <main className="app-main">
        <div className="page-shell mistakes-shell">
          <section className="mistakes-hero-card">
            <div className="mistakes-hero-copy">
              <p className="eyebrow">Personalised revision</p>
              <h1>Turn your mistakes into progress.</h1>
              <p>
                Revisit the questions you have missed, practise them again and build confidence
                where you need it most.
              </p>
            </div>
            <div className="mistakes-hero-art">
              <Image
                src="/images/theoryprep-mistakes.png"
                alt="TheoryPrep mistakes practice illustration"
                width={620}
                height={390}
                sizes="(max-width: 760px) 100%, 46vw"
                priority
              />
            </div>
          </section>

          <section className="mistakes-session-card">
            <div className="mistakes-section-heading">
              <div>
                <p className="eyebrow">Choose a session</p>
                <h2>How much do you want to practise?</h2>
              </div>
              <span>{mistakes.length} mistake{mistakes.length === 1 ? "" : "s"} saved</span>
            </div>

            <div className="mistake-session-options" role="group" aria-label="Mistake practice session size">
              <button
                type="button"
                className={sessionSize === 10 ? "mistake-session-option mistake-session-option-active" : "mistake-session-option"}
                onClick={() => setSessionSize(10)}
              >
                <strong>10</strong>
                <span>questions</span>
                <small>Quick review</small>
              </button>
              <button
                type="button"
                className={sessionSize === 20 ? "mistake-session-option mistake-session-option-active" : "mistake-session-option"}
                onClick={() => setSessionSize(20)}
              >
                <strong>20</strong>
                <span>questions</span>
                <small>Focused session</small>
              </button>
              <button
                type="button"
                className={sessionSize === "all" ? "mistake-session-option mistake-session-option-active" : "mistake-session-option"}
                onClick={() => setSessionSize("all")}
              >
                <strong>All</strong>
                <span>{mistakes.length} questions</span>
                <small>Work through everything</small>
              </button>
            </div>

            <div className="mistakes-start-row">
              <div>
                <strong>{selectedCount} question{selectedCount === 1 ? "" : "s"} ready to practise</strong>
                <span>{sessionSize === "all" ? "Every saved mistake will be included." : "Questions are shuffled for a fresh review."}</span>
              </div>
              <button className="button button-primary" type="button" onClick={() => start()}>
                Start practice <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="mistakes-categories-card">
            <div className="mistakes-section-heading">
              <div>
                <p className="eyebrow">Where to focus</p>
                <h2>Your mistakes by topic.</h2>
              </div>
              <span>Grouped automatically</span>
            </div>

            <div className="mistake-category-list">
              {categoryGroups.map(([category, items]) => (
                <details className="mistake-category" key={category}>
                  <summary>
                    <span className="mistake-category-name">{category}</span>
                    <span className="mistake-category-count">
                      {items.length} mistake{items.length === 1 ? "" : "s"}
                    </span>
                    <span className="mistake-category-chevron" aria-hidden="true" />
                  </summary>
                  <div className="mistake-category-questions">
                    {items.slice(0, 6).map((question) => (
                      <Link href={"/questions/" + question.id} key={question.id}>
                        <strong>{question.question}</strong>
                        <span>Question {question.id} ↗</span>
                      </Link>
                    ))}
                    {items.length > 6 && (
                      <span className="mistake-category-more">+ {items.length - 6} more in this category</span>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <Link className="mistakes-back-link" href="/progress">Back to my progress ↗</Link>
        </div>
      </main>
    );
  }

  const current = session[position];
  const answered = selected !== null;

  if (!current) {
    return (
      <main className="app-main">
        <div className="page-shell progress-shell">
          <section className="completion-panel">
            <span className="completion-mark" aria-hidden="true">✓</span>
            <p className="eyebrow">Mistake practice complete</p>
            <h2>{correctCount} / {session.length}</h2>
            <p>Nice work. Keep revisiting missed questions until they become easy.</p>
            <div className="progress-cta-row">
              <button className="button button-primary" type="button" onClick={() => start(sessionSize)}>
                Practise again <span aria-hidden="true">↻</span>
              </button>
              <Link className="button button-secondary" href="/progress">See my progress</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Personalised practice</p>
            <h1>Your mistakes.</h1>
          </div>
          <Link className="button button-secondary" href="/progress">My progress</Link>
        </div>

        <div className="practice-meta">
          <ProgressBar current={position + 1} total={session.length} label="Mistake practice progress" />
          <div className="score-display">
            <span>Score</span>
            <strong>{correctCount}</strong>
            <span className="score-divider">/</span>
            <span>{position + (answered ? 1 : 0)}</span>
          </div>
        </div>

        <QuestionCard question={current} eyebrow={(current.taxonomy.category ?? current.category ?? "General") + " · Question " + (position + 1)}>
          {current.answers.map((answer, index) => (
            <AnswerOption
              key={current.id + "-" + index}
              answer={answer}
              index={index}
              selected={selected === answer}
              disabled={answered}
              correct={answered && answer === current.correctAnswer}
              incorrect={answered && selected === answer && answer !== current.correctAnswer}
              onSelect={() => {
                if (answered) return;
                setSelected(answer);
                if (answer === current.correctAnswer) setCorrectCount((score) => score + 1);
                void recordQuestionAttempt(current, answer, answer === current.correctAnswer, "smart");
              }}
            />
          ))}
        </QuestionCard>

        {answered && (
          <div className="feedback-block">
            <p className={"feedback-line " + (selected === current.correctAnswer ? "feedback-good" : "feedback-bad")} role="status">
              <strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong>{" "}
              {selected === current.correctAnswer ? "You got this one right this time." : "Keep this one on your radar."}
            </p>
            <ExplanationCard explanation={current.explanation} />
            <button
              className="button button-primary continue-button"
              type="button"
              onClick={() => { setPosition((step) => step + 1); setSelected(null); }}
            >
              {position + 1 === session.length ? "Finish session" : "Next question"} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
