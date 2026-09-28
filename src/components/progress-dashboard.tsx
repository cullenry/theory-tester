"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";
import { DailyMission } from "@/components/daily-mission";
import { getProgressData, type QuestionAttempt } from "@/lib/progress";

type CategoryStat = { name: string; attempted: number; correct: number; accuracy: number };
type ProgressTab = "overview" | "starred";

function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  if (name) return name;
  const fallback = user.email?.split("@")[0]?.replace(/[._-]+/g, " ");
  return fallback ? fallback.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "there";
}

function getStreak(attempts: QuestionAttempt[]) {
  const days = new Set(attempts.map((attempt) => attempt.created_at.slice(0, 10)));
  const currentDay = new Date();
  let current = 0;
  while (true) {
    const key = currentDay.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    current += 1;
    currentDay.setDate(currentDay.getDate() - 1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of sorted) {
    const day = new Date(key + "T00:00:00Z");
    if (previous && day.getTime() - previous.getTime() === 86400000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    previous = day;
  }
  return { current, best };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short" }).format(new Date(value));
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function AccuracyChart({ attempts }: { attempts: QuestionAttempt[] }) {
  const points = useMemo(() => {
    const grouped = new Map<string, { correct: number; total: number }>();
    for (const attempt of [...attempts].reverse()) {
      const key = attempt.created_at.slice(0, 10);
      const entry = grouped.get(key) ?? { correct: 0, total: 0 };
      if (attempt.selected_answer !== null) {
        entry.total += 1;
        if (attempt.is_correct) entry.correct += 1;
      }
      grouped.set(key, entry);
    }
    return [...grouped.entries()].slice(-14).map(([date, value]) => ({ date, accuracy: value.total ? Math.round((value.correct / value.total) * 100) : 0 }));
  }, [attempts]);

  if (points.length < 2) return <div className="chart-empty">Answer a few more questions to see your accuracy trend.</div>;
  const coordinates = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 92 - (point.accuracy / 100) * 78;
    return x + "," + y;
  }).join(" ");

  return <div className="accuracy-chart"><svg viewBox="0 0 100 100" role="img" aria-label="Accuracy over the last fourteen active days"><line x1="0" y1="92" x2="100" y2="92" className="chart-grid-line" /><line x1="0" y1="53" x2="100" y2="53" className="chart-grid-line" /><line x1="0" y1="14" x2="100" y2="14" className="chart-grid-line" /><polyline points={coordinates} className="chart-line" /></svg><div className="chart-labels"><span>{formatDate(points[0].date)}</span><span>{formatDate(points[points.length - 1].date)}</span></div></div>;
}

function getReadinessComment(score: number) {
  if (score === 100) return "Outstanding preparation. Your recorded performance is exceptionally strong.";
  if (score >= 95) return "Excellent preparation. You're in very strong shape for test day.";
  if (score >= 90) return "Great shape. Keep the momentum going and stay sharp.";
  if (score >= 80) return "Solid preparation. A little more targeted practice can tighten things up.";
  if (score >= 70) return "You're building well. Focus on your weaker areas next.";
  if (score >= 60) return "Good start. More practice across your weaker topics should help.";
  if (score >= 40) return "Keep going. Use Learn mode to target the areas giving you trouble.";
  return "Just getting started. Build consistency with regular practice.";
}

function Readiness({ accuracy, mockAverage, coverage, userId }: { accuracy: number; mockAverage: number; coverage: number; userId: string }) {
  const score = Math.round(accuracy * 0.45 + mockAverage * 0.35 + coverage * 0.2);
  const comment = getReadinessComment(score);
  const [history, setHistory] = useState<Array<{ date: string; score: number }>>([]);

  useEffect(() => {
    try {
      const now = new Date();
      const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 31);
      const cutoff = [cutoffDate.getFullYear(), String(cutoffDate.getMonth() + 1).padStart(2, "0"), String(cutoffDate.getDate()).padStart(2, "0")].join("-");
      const storageKey = "theorytester-readiness-history-" + userId;
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as Array<{ date: string; score: number }>;
      const withoutToday = stored.filter((entry) => entry.date !== today).filter((entry) => entry.date >= cutoff);
      const next = [...withoutToday, { date: today, score }].slice(-31);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setHistory(next);
    } catch {
      setHistory([]);
    }
  }, [score, userId]);

  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = previous ? score - previous.score : null;

  return <section className="progress-feature-card readiness-card">
    <div>
      <p className="eyebrow">Practice benchmark</p>
      <h2>Test readiness</h2>
      <p>Based on your question accuracy, mock-test performance and topic coverage. It is a practice metric, not a prediction of your test result.</p>
      <p className="readiness-comment">{comment}</p>
      <div className="readiness-actions">
        <Link className="text-action" href="/test-ready">Open Test Ready check ↗</Link>
        {delta !== null && <span className={delta >= 0 ? "readiness-delta readiness-delta-up" : "readiness-delta readiness-delta-down"}>{delta > 0 ? "+" : ""}{delta} since your last saved check</span>}
      </div>
    </div>
    <div className="readiness-score"><strong>{score}</strong><span>/100</span></div>
    <div className="readiness-bar"><span style={{ width: score + "%" }} /></div>
    <div className="readiness-facts"><span>{accuracy}% question accuracy</span><span>{mockAverage}% mock average</span><span>{coverage}% topic coverage</span></div>
  </section>;
}

function StarredQuestions({ questionIds, bookmarksAvailable }: { questionIds: number[]; bookmarksAvailable: boolean }) {
  const starredQuestions = questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is (typeof questions)[number] => Boolean(question));

  return (
    <section className="progress-feature-card starred-questions-panel">
      <div className="feature-card-heading">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h2>Starred questions</h2>
        </div>
        <span>{starredQuestions.length} saved</span>
      </div>
      {!bookmarksAvailable ? (
        <div className="chart-empty starred-empty">
          <strong>One database step left.</strong>
          <span>Run <code>supabase/migrations/002_question_bookmarks.sql</code> in Supabase to save starred questions.</span>
        </div>
      ) : starredQuestions.length === 0 ? (
        <div className="chart-empty starred-empty">
          <strong>No starred questions yet.</strong>
          <span>Tap the ☆ Star button on any question to save it here.</span>
        </div>
      ) : (
        <>
          <div className="starred-question-list">
            {starredQuestions.map((question, index) => (
              <Link className="starred-question-row" href={"/questions/" + question.id} key={question.id}>
                <span className="starred-question-star" aria-hidden="true">★</span>
                <div>
                  <strong>{question.question}</strong>
                  <small>Question {index + 1} · {question.taxonomy.category ?? "General"}</small>
                </div>
                <span className="row-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
          <div className="starred-actions">
            <Link className="button button-primary" href="/practice?starred=1">Practise starred questions <span aria-hidden="true">→</span></Link>
            <Link className="button button-secondary" href="/questions">Browse library</Link>
          </div>
        </>
      )}
    </section>
  );
}
export function ProgressDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  const [activeTab, setActiveTab] = useState<ProgressTab>("overview");
  useEffect(() => { getProgressData().then(setData); }, []);

  if (!data) return <main className="app-main"><div className="page-shell progress-shell"><div className="progress-loading">Loading your progress…</div></div></main>;
  if (!data.user) return <main className="app-main"><div className="page-shell progress-shell"><section className="empty-state progress-login-state"><p className="eyebrow">Your progress</p><h1>Sign in to see your stats.</h1><p>Your practice history, mock tests, streaks and mistakes will appear here once you have an account.</p><Link className="button button-primary" href="/login">Sign in <span aria-hidden="true">→</span></Link></section></div></main>;

  const answeredAttempts = data.attempts.filter((attempt) => attempt.selected_answer !== null);
  const correct = answeredAttempts.filter((attempt) => attempt.is_correct).length;
  const accuracy = answeredAttempts.length ? Math.round((correct / answeredAttempts.length) * 100) : 0;
  const streak = getStreak(data.attempts);
  const bestMock = data.mockTests.length ? Math.max(...data.mockTests.map((test) => test.percentage)) : 0;
  const averageMock = data.mockTests.length ? Math.round(data.mockTests.reduce((total, test) => total + test.percentage, 0) / data.mockTests.length) : 0;

  const categoryStats: CategoryStat[] = taxonomyCategories.map((category) => {
    const questionIds = new Set(questions.filter((question) => question.taxonomy.category === category.name).map((question) => question.id));
    const categoryAttempts = answeredAttempts.filter((attempt) => questionIds.has(attempt.question_id));
    const categoryCorrect = categoryAttempts.filter((attempt) => attempt.is_correct).length;
    return { name: category.name, attempted: categoryAttempts.length, correct: categoryCorrect, accuracy: categoryAttempts.length ? Math.round((categoryCorrect / categoryAttempts.length) * 100) : 0 };
  }).filter((category) => category.attempted > 0);

  const sortedWeak = [...categoryStats].sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);
  const topicCoverage = Math.min(100, Math.round((categoryStats.length / Math.max(1, taxonomyCategories.length)) * 100));
  const latestMistakes = data.attempts
    .filter((attempt) => !attempt.is_correct && attempt.selected_answer !== null)
    .filter((attempt, index, all) => all.findIndex((item) => item.question_id === attempt.question_id) === index)
    .slice(0, 5)
    .map((attempt) => questions.find((question) => question.id === attempt.question_id))
    .filter((question): question is (typeof questions)[number] => Boolean(question));

  const achievements = [
    { icon: "✓", title: "First question", earned: answeredAttempts.length >= 1 },
    { icon: "5", title: "Quick five", earned: answeredAttempts.length >= 5 },
    { icon: "100", title: "100 questions", earned: answeredAttempts.length >= 100 },
    { icon: "500", title: "500 questions", earned: answeredAttempts.length >= 500 },
    { icon: "80%", title: "80% accuracy", earned: answeredAttempts.length >= 20 && accuracy >= 80 },
    { icon: "🔥", title: "7 day streak", earned: streak.best >= 7 },
    { icon: "40", title: "First full mock", earned: data.mockTests.some((test) => test.question_count === 40) },
    { icon: "★", title: "Perfect mock", earned: data.mockTests.some((test) => test.percentage === 100) },
    { icon: "★", title: "10 starred", earned: data.starredQuestionIds.length >= 10 },
    { icon: "🎯", title: "Ready to focus", earned: categoryStats.length >= 5 },
  ];

  return <main className="app-main"><div className="page-shell progress-shell">
    <div className="progress-hero"><div><p className="eyebrow">Your TheoryPrep</p><h1>Hello, {getDisplayName(data.user)}.</h1><p>See what you know, where you can improve and how your practice is building over time.</p></div><Link className="button button-primary" href="/practice">Practise now <span aria-hidden="true">→</span></Link></div>
    {!data.available && <div className="setup-note"><strong>One database step left.</strong> Run <code>supabase/migrations/001_progress.sql</code> in your Supabase SQL Editor to turn on saved progress.</div>}
    <div className="progress-tabs" role="tablist" aria-label="My progress sections">
      <button className={activeTab === "overview" ? "progress-tab progress-tab-active" : "progress-tab"} type="button" role="tab" aria-selected={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</button>
      <button className={activeTab === "starred" ? "progress-tab progress-tab-active" : "progress-tab"} type="button" role="tab" aria-selected={activeTab === "starred"} onClick={() => setActiveTab("starred")}>★ Starred questions <span>{data.starredQuestionIds.length}</span></button>
    </div>
    {activeTab === "starred" ? <StarredQuestions questionIds={data.starredQuestionIds} bookmarksAvailable={data.bookmarksAvailable} /> : <>
    <div className="stats-grid"><StatCard label="Questions answered" value={answeredAttempts.length.toLocaleString()} detail="Across all practice modes" /><StatCard label="Accuracy" value={accuracy + "%"} detail={correct ? correct + " correct answers" : "Start answering to build your stats"} /><StatCard label="Current streak" value={streak.current + " day" + (streak.current === 1 ? "" : "s")} detail={streak.best + "-day best"} /><StatCard label="Mock tests" value={String(data.mockTests.length)} detail={bestMock ? "Best score " + bestMock + "%" : "Take your first mock"} /></div>
    <div className="progress-main-grid"><section className="progress-feature-card"><div className="feature-card-heading"><div><p className="eyebrow">Your trend</p><h2>Accuracy over time</h2></div><span>{answeredAttempts.length ? accuracy + "% overall" : "No data yet"}</span></div><AccuracyChart attempts={data.attempts} /></section>
    <section className="progress-feature-card"><div className="feature-card-heading"><div><p className="eyebrow">Mock tests</p><h2>Recent results</h2></div><Link href="/mock-test">Take one ↗</Link></div>{data.mockTests.length === 0 ? <div className="chart-empty">Your completed mock tests will appear here.</div> : <div className="mock-history-list">{data.mockTests.slice(0, 5).map((test) => <div className="mock-history-row" key={test.id}><div><strong>{test.question_count} Question Test</strong><small>{formatDate(test.created_at)} · {test.time_expired ? "Time expired" : "Completed"}</small></div><strong>{test.correct_count}/{test.question_count}</strong><span>{test.percentage}%</span></div>)}</div>}</section></div>
    <Readiness accuracy={accuracy} mockAverage={averageMock} coverage={topicCoverage} userId={data.user.id} />
    <div className="progress-main-grid"><section className="progress-feature-card"><div className="feature-card-heading"><div><p className="eyebrow">Topic performance</p><h2>Where to focus</h2></div></div>{sortedWeak.length === 0 ? <div className="chart-empty">Start practising to build topic-level insights.</div> : <div className="topic-performance-list">{sortedWeak.slice(0, 6).map((category) => <div className="topic-performance-row" key={category.name}><div className="topic-performance-copy"><strong>{category.name}</strong><small>{category.attempted} questions attempted</small></div><span>{category.accuracy}%</span><div className="topic-performance-bar"><i style={{ width: category.accuracy + "%" }} /></div><Link href={"/practice?category=" + encodeURIComponent(category.name)}>Practise</Link></div>)}</div>}</section>
    <section className="progress-feature-card"><div className="feature-card-heading"><div><p className="eyebrow">Mistakes</p><h2>Practise what you missed</h2></div><Link href="/mistakes">All mistakes ↗</Link></div>{latestMistakes.length === 0 ? <div className="chart-empty">Your recent incorrect answers will collect here.</div> : <div className="mistake-list">{latestMistakes.map((question) => <Link href={"/questions/" + question.id} className="mistake-row" key={question.id}><span>×</span><strong>{question.question}</strong><small>Question {question.id}</small></Link>)}</div>}{latestMistakes.length > 0 && <Link className="button button-secondary progress-inline-button" href="/mistakes">Practise my mistakes <span aria-hidden="true">→</span></Link>}</section></div>
    <DailyMission />
    <section className="progress-feature-card"><div className="feature-card-heading"><div><p className="eyebrow">Achievements</p><h2>Keep building</h2></div></div><div className="achievement-grid">{achievements.map((achievement) => <div className={"achievement-card " + (achievement.earned ? "achievement-earned" : "")} key={achievement.title}><span>{achievement.icon}</span><div><strong>{achievement.title}</strong><small>{achievement.earned ? "Unlocked" : "Keep practising"}</small></div></div>)}</div></section>
    <div className="progress-cta-row"><Link className="button button-secondary" href="/challenge">🔥 Daily Challenge</Link><Link className="button button-secondary" href="/test-ready">Test Ready</Link><Link className="button button-primary" href="/practice">Start a practice set <span aria-hidden="true">→</span></Link></div>
    </>}
  </div></main>;
}
