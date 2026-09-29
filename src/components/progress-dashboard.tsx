"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions";
import { getProgressData, type QuestionAttempt } from "@/lib/progress";
import { MobileAppTools } from "@/components/mobile-app-tools";
import {
  getChapterProgress,
  getCourseChapters,
  getCourseProgress,
  getNextCourseLesson,
} from "@/lib/course";

type TopicRow = {
  name: string;
  seen: number;
  total: number;
  percent: number;
  accuracy: number | null;
  attempts: number;
};

function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : "";

  if (name) return name;

  const fallback = user.email?.split("@")[0]?.replace(/[._-]+/g, " ");
  return fallback
    ? fallback
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "there";
}

function getStreak(attempts: QuestionAttempt[]) {
  const days = new Set(
    attempts
      .filter((attempt) => attempt.selected_answer !== null)
      .map((attempt) => attempt.created_at.slice(0, 10)),
  );

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let current = 0;
  const cursor = new Date(days.has(todayKey) ? today : yesterday);

  if (!days.has(todayKey) && !days.has(yesterdayKey)) {
    current = 0;
  } else {
    while (days.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let best = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const key of [...days].sort()) {
    const day = new Date(key + "T00:00:00Z");
    if (previous && day.getTime() - previous.getTime() === 86_400_000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short" }).format(new Date(value));
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="dashboard-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function TestReadiness({ accuracy, mockAverage, topicCoverage }: { accuracy: number; mockAverage: number; topicCoverage: number }) {
  const score = Math.round(accuracy * 0.45 + mockAverage * 0.35 + topicCoverage * 0.2);

  const meaning =
    score >= 90
      ? "Your practice data shows strong preparation. Keep testing yourself to stay sharp."
      : score >= 80
        ? "You're building a solid base. Target weaker topics and keep taking mocks."
        : score >= 70
          ? "You're making good progress. More focused revision should strengthen your weaker areas."
          : score >= 50
            ? "You're on your way. Use Learn and targeted practice to build consistency."
            : "You're still building your base. Regular practice will give this score more meaning.";

  return (
    <section className="progress-feature-card readiness-card" aria-labelledby="test-readiness-title">
      <div>
        <p className="eyebrow">Practice benchmark</p>
        <h2 id="test-readiness-title">Test readiness</h2>
        <p>
          A simple score based on your question accuracy, mock-test performance and topic coverage.
          It reflects your current practice data, not a prediction of your exam result.
        </p>
        <p className="readiness-comment">{meaning}</p>
      </div>
      <div className="readiness-score" aria-label={score + " out of 100"}>
        <strong>{score}</strong>
        <span>/100</span>
      </div>
      <div className="readiness-bar" aria-hidden="true">
        <span style={{ width: score + "%" }} />
      </div>
      <div className="readiness-facts">
        <span>{accuracy}% question accuracy</span>
        <span>{mockAverage}% mock average</span>
        <span>{topicCoverage}% topic coverage</span>
      </div>
    </section>
  );
}

function TopicProgress({ topics }: { topics: TopicRow[] }) {
  return (
    <section className="dashboard-card dashboard-topics-card">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Topic progress</p>
          <h2>Know where you stand.</h2>
        </div>
        <Link href="/questions">Browse all ↗</Link>
      </div>

      {topics.length === 0 ? (
        <div className="dashboard-empty">
          <strong>Your topics will appear here as you practise.</strong>
          <span>Start with the course and your progress will build automatically.</span>
        </div>
      ) : (
        <div className="dashboard-topic-list">
          {topics.slice(0, 6).map((topic) => (
            <Link className="dashboard-topic-row" href={"/practice?category=" + encodeURIComponent(topic.name)} key={topic.name}>
              <div className="dashboard-topic-copy">
                <strong>{topic.name}</strong>
                <small>
                  {topic.seen}/{topic.total} covered
                  {topic.accuracy !== null ? ` · ${topic.accuracy}% accuracy` : " · Not tested yet"}
                </small>
              </div>
              <span>{topic.percent}%</span>
              <div className="dashboard-topic-bar"><i style={{ width: topic.percent + "%" }} /></div>
              <span className="dashboard-topic-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentMocks({ mocks }: { mocks: Awaited<ReturnType<typeof getProgressData>>["mockTests"] }) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Mock tests</p>
          <h2>Recent results.</h2>
        </div>
        <Link href="/mock-test">Take one ↗</Link>
      </div>

      {mocks.length === 0 ? (
        <div className="dashboard-empty">
          <strong>No mocks yet.</strong>
          <span>Take a full timed test when you want to check your progress under pressure.</span>
        </div>
      ) : (
        <div className="dashboard-mock-list">
          {mocks.slice(0, 4).map((test) => (
            <div className="dashboard-mock-row" key={test.id}>
              <div>
                <strong>{test.question_count}-question mock</strong>
                <small>{formatDate(test.created_at)} · {test.time_expired ? "Time expired" : "Completed"}</small>
              </div>
              <strong>{test.percentage}%</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentMistakes({ questionIds }: { questionIds: number[] }) {
  const mistakeQuestions = questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is (typeof questions)[number] => Boolean(question));

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Keep improving</p>
          <h2>Questions to revisit.</h2>
        </div>
        <Link href="/mistakes">All mistakes ↗</Link>
      </div>

      {mistakeQuestions.length === 0 ? (
        <div className="dashboard-empty">
          <strong>Nothing waiting for review.</strong>
          <span>When you miss something, it will show up here.</span>
        </div>
      ) : (
        <>
          <div className="dashboard-mistake-list">
            {mistakeQuestions.slice(0, 4).map((question) => (
              <Link className="dashboard-mistake-row" href={"/questions/" + question.id} key={question.id}>
                <span aria-hidden="true">×</span>
                <strong>{question.question}</strong>
                <small>{question.taxonomy.category ?? "General"} · Question {question.id}</small>
              </Link>
            ))}
          </div>
          <Link className="button button-secondary dashboard-full-width-button" href="/mistakes">
            Practise my mistakes <span aria-hidden="true">→</span>
          </Link>
        </>
      )}
    </section>
  );
}

export function ProgressDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);

  useEffect(() => {
    getProgressData(2000).then(setData);
  }, []);

  const chapters = useMemo(() => getCourseChapters(), []);
  const courseProgress = useMemo(() => getCourseProgress(data?.attempts ?? []), [data?.attempts]);
  const nextLesson = useMemo(() => getNextCourseLesson(data?.attempts ?? []), [data?.attempts]);
  const streak = useMemo(() => getStreak(data?.attempts ?? []), [data?.attempts]);

  const topics = useMemo<TopicRow[]>(() => {
    const attempts = (data?.attempts ?? []).filter((attempt) => attempt.selected_answer !== null);
    const attemptedByQuestion = new Map<number, number>();

    for (const attempt of attempts) {
      attemptedByQuestion.set(attempt.question_id, (attemptedByQuestion.get(attempt.question_id) ?? 0) + 1);
    }

    return chapters
      .map((chapter) => {
        const questionIds = new Set(chapter.questions.map((question) => question.id));
        const chapterAttempts = attempts.filter((attempt) => questionIds.has(attempt.question_id));
        const correct = chapterAttempts.filter((attempt) => attempt.is_correct).length;
        const chapterProgress = getChapterProgress(chapter, courseProgress.seen);

        return {
          name: chapter.name,
          seen: chapterProgress.seenCount,
          total: chapterProgress.total,
          percent: chapterProgress.percent,
          accuracy: chapterAttempts.length ? Math.round((correct / chapterAttempts.length) * 100) : null,
          attempts: [...questionIds].reduce((total, id) => total + (attemptedByQuestion.get(id) ?? 0), 0),
        };
      })
      .filter((topic) => topic.total > 0)
      .sort((a, b) => {
        if (a.accuracy !== null && b.accuracy !== null && Math.abs(a.accuracy - b.accuracy) >= 1) {
          return a.accuracy - b.accuracy;
        }
        return a.percent - b.percent;
      });
  }, [chapters, data?.attempts, courseProgress.seen]);

  const answered = (data?.attempts ?? []).filter((attempt) => attempt.selected_answer !== null);
  const correct = answered.filter((attempt) => attempt.is_correct).length;
  const accuracy = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const mockAverage = data?.mockTests.length
    ? Math.round(data.mockTests.reduce((total, test) => total + test.percentage, 0) / data.mockTests.length)
    : 0;
  const topicCoverage = topics.length
    ? Math.round((topics.filter((topic) => topic.seen > 0).length / topics.length) * 100)
    : 0;


  const latestMistakes = useMemo(() => {
    const seen = new Set<number>();
    return (data?.attempts ?? [])
      .filter((attempt) => attempt.selected_answer !== null && !attempt.is_correct)
      .filter((attempt) => {
        if (seen.has(attempt.question_id)) return false;
        seen.add(attempt.question_id);
        return true;
      })
      .slice(0, 5)
      .map((attempt) => attempt.question_id);
  }, [data?.attempts]);

  if (!data) {
    return (
      <main className="app-main">
        <div className="page-shell dashboard-shell">
          <div className="dashboard-loading">Loading your dashboard…</div>
        </div>
      </main>
    );
  }

  if (!data.user) {
    return (
      <main className="app-main">
        <div className="page-shell dashboard-shell">
          <section className="empty-state dashboard-login-state">
            <p className="eyebrow">Your TheoryPrep dashboard</p>
            <h1>Sign in and make the practice yours.</h1>
            <p>Your course position, topic progress, mistakes, streaks and mock-test history will stay with your account.</p>
            <Link className="button button-primary" href="/login?next=/progress">Sign in <span aria-hidden="true">→</span></Link>
          </section>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(data.user);
  const firstName = displayName.split(" ")[0];
  const continueHref = "/practice/learn";

  return (
    <main className="app-main">
      <div className="page-shell dashboard-shell">
        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">Your TheoryPrep</p>
            <h1>Good to see you, {firstName}.</h1>
            <p>
              Keep your momentum going. Your dashboard is centred on what to do next, with the detail underneath when you need it.
            </p>
          </div>
          <Link className="button button-primary" href={continueHref}>
            {courseProgress.seenCount ? "Continue learning" : "Start learning"} <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="dashboard-course-card">
          <div className="dashboard-course-top">
            <div>
              <p className="eyebrow">The Learn course</p>
              <h2>{courseProgress.seenCount ? "Keep moving through the question bank." : "Start with a small lesson."}</h2>
              <p>
                {nextLesson
                  ? `${nextLesson.chapter.name} · Lesson ${nextLesson.lessonIndex + 1} of ${nextLesson.chapter.lessons.length}`
                  : "You’ve covered the whole course. Revisit any chapter whenever you like."}
              </p>
            </div>
            <strong>{courseProgress.percent}%</strong>
          </div>
          <div className="dashboard-course-bar"><span style={{ width: courseProgress.percent + "%" }} /></div>
          <div className="dashboard-course-bottom">
            <span><strong>{courseProgress.seenCount}</strong> of {courseProgress.total} questions covered</span>
            <Link href="/practice/learn">View course map ↗</Link>
          </div>
        </section>

        <div className="dashboard-stats">
          <Stat label="Questions covered" value={courseProgress.seenCount.toLocaleString()} detail={`${courseProgress.percent}% of the bank`} />
          <Stat label="Accuracy" value={accuracy + "%"} detail={answered.length ? `${correct} correct answers` : "Start answering"} />
          <Stat label="Current streak" value={streak.current + " day" + (streak.current === 1 ? "" : "s")} detail={streak.best + "-day best"} />
          <Stat label="Mock tests" value={String(data.mockTests.length)} detail={data.mockTests.length ? "Completed on this account" : "Take your first mock"} />
        </div>

        <TestReadiness accuracy={accuracy} mockAverage={mockAverage} topicCoverage={topicCoverage} />

        <div className="dashboard-grid">
          <TopicProgress topics={topics} />
          <div className="dashboard-stack">
            <RecentMocks mocks={data.mockTests} />
            <RecentMistakes questionIds={latestMistakes} />
          </div>
        </div>

        <section className="dashboard-actions-card">
          <div>
            <p className="eyebrow">Quick actions</p>
            <h2>What are you in the mood for?</h2>
          </div>
          <div className="dashboard-action-grid">
            <Link href="/practice/learn"><strong>Learn</strong><span>Follow the 805-question course →</span></Link>
            <Link href="/practice"><strong>Practise</strong><span>Pick a topic or session length →</span></Link>
            <Link href="/mock-test"><strong>Mock test</strong><span>Take the timed 40-question test →</span></Link>
            <Link href="/questions"><strong>Question bank</strong><span>Search and personalise the library →</span></Link>
          </div>
        </section>
        <MobileAppTools />
      </div>
    </main>
  );
}
