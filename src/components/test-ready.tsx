"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProgressData } from "@/lib/progress";
import { questions } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";

function getComment(score: number) {
  if (score >= 95) return "Your recorded practice is very strong. Keep your recent performance consistent.";
  if (score >= 85) return "You have built a solid base. Use the focus areas below to tighten the remaining gaps.";
  if (score >= 70) return "You have a useful base to build from. Target weaker topics and keep using timed tests.";
  if (score >= 50) return "Keep building consistency across questions, topics and mock tests.";
  return "Start with regular practice, then use Learn to build stronger topic coverage.";
}

function Check({ done, title, detail }: { done: boolean; title: string; detail: string }) {
  return (
    <article className={done ? "ready-check ready-check-done" : "ready-check"}>
      <span className="ready-check-mark" aria-hidden="true">{done ? "✓" : "○"}</span>
      <div><strong>{title}</strong><p>{detail}</p></div>
    </article>
  );
}

export function TestReady() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);

  useEffect(() => { getProgressData(2000).then(setData); }, []);

  if (!data) {
    return <main className="app-main"><div className="page-shell progress-shell"><div className="progress-loading">Building your Test Ready check…</div></div></main>;
  }

  if (!data.user) {
    return <main className="app-main"><div className="page-shell progress-shell"><section className="empty-state progress-login-state"><p className="eyebrow">Test Ready</p><h1>Sign in to build your preparation snapshot.</h1><p>Your question history, topic coverage, mock tests and streak can be used to create a personalised checklist.</p><Link className="button button-primary" href="/login">Sign in <span aria-hidden="true">→</span></Link></section></div></main>;
  }

  const answeredAttempts = data.attempts.filter((attempt) => attempt.selected_answer !== null);
  const correct = answeredAttempts.filter((attempt) => attempt.is_correct).length;
  const accuracy = answeredAttempts.length ? Math.round((correct / answeredAttempts.length) * 100) : 0;
  const mockAverage = data.mockTests.length
    ? Math.round(data.mockTests.reduce((total, test) => total + test.percentage, 0) / data.mockTests.length)
    : 0;
  const categoryNames = new Set(
    answeredAttempts
      .map((attempt) => questions.find((question) => question.id === attempt.question_id)?.taxonomy.category)
      .filter((category): category is string => Boolean(category)),
  );
  const coverage = Math.min(100, Math.round((categoryNames.size / Math.max(1, taxonomyCategories.length)) * 100));
  const score = Math.round(accuracy * 0.45 + mockAverage * 0.35 + coverage * 0.2);

  const categoryStats = taxonomyCategories.map((category) => {
    const ids = new Set(questions.filter((question) => question.taxonomy.category === category.name).map((question) => question.id));
    const categoryAttempts = answeredAttempts.filter((attempt) => ids.has(attempt.question_id));
    const categoryCorrect = categoryAttempts.filter((attempt) => attempt.is_correct).length;
    return {
      name: category.name,
      attempted: categoryAttempts.length,
      accuracy: categoryAttempts.length ? Math.round((categoryCorrect / categoryAttempts.length) * 100) : null,
    };
  });
  const focusTopics = [...categoryStats]
    .filter((category) => category.accuracy !== null)
    .sort((a, b) => (a.accuracy as number) - (b.accuracy as number) || b.attempted - a.attempted)
    .slice(0, 3);

  const checks = [
    { done: answeredAttempts.length >= 50, title: "Build a question base", detail: answeredAttempts.length >= 50 ? `${answeredAttempts.length} questions answered` : `${answeredAttempts.length}/50 questions answered` },
    { done: coverage >= 70, title: "Cover the main topics", detail: `${coverage}% of your topic categories have practice history` },
    { done: accuracy >= 80, title: "Keep question accuracy high", detail: `${accuracy}% overall recorded accuracy` },
    { done: data.mockTests.length >= 2, title: "Use timed mock tests", detail: `${data.mockTests.length} mock test${data.mockTests.length === 1 ? "" : "s"} completed` },
  ];

  return (
    <main className="app-main">
      <div className="page-shell progress-shell">
        <div className="progress-hero test-ready-hero">
          <div><p className="eyebrow">Preparation snapshot</p><h1>Test Ready</h1><p>Use your recorded practice to see what is strong, what still needs work and what to practise next.</p></div>
          <div className="test-ready-score"><strong>{score}</strong><span>/100</span><small>practice metric</small></div>
        </div>

        <div className="test-ready-stack">
        <section className="progress-feature-card test-ready-note">
          <div><p className="eyebrow">How to read this</p><h2>Built from your practice history.</h2><p>{getComment(score)} This is a personalised practice metric, not a prediction of your result on the real test.</p></div>
          <Link className="button button-primary" href="/practice/learn">Work on weak spots <span aria-hidden="true">→</span></Link>
        </section>

        <section className="progress-feature-card">
          <div className="feature-card-heading"><div><p className="eyebrow">Checklist</p><h2>Preparation milestones</h2></div><span>{checks.filter((item) => item.done).length}/{checks.length}</span></div>
          <div className="ready-check-grid">{checks.map((item) => <Check key={item.title} {...item} />)}</div>
        </section>

        <section className="progress-feature-card">
          <div className="feature-card-heading"><div><p className="eyebrow">Where to focus</p><h2>Your lowest recorded topics</h2></div></div>
          {focusTopics.length === 0 ? (
            <div className="chart-empty">Keep practising to build topic-level insights.</div>
          ) : (
            <div className="ready-focus-list">
              {focusTopics.map((topic) => (
                <div className="ready-focus-row" key={topic.name}>
                  <div><strong>{topic.name}</strong><small>{topic.attempted} questions attempted · {topic.accuracy}% accuracy</small></div>
                  <Link className="button button-secondary" href={"/practice?category=" + encodeURIComponent(topic.name)}>Practise <span aria-hidden="true">→</span></Link>
                </div>
              ))}
            </div>
          )}
        </section>

        </div>

        <div className="progress-cta-row">
          <Link className="button button-secondary" href="/progress">Back to My Progress</Link>
          <Link className="button button-primary" href="/mock-test">Take a timed mock <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </main>
  );
}
