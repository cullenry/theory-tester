"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions";
import { getProgressData, type QuestionAttempt } from "@/lib/progress";
import { getStreakProtection } from "@/lib/streak-protection";
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
  mastery: number | null;
  masteryRate: number | null;
  weightedCorrect: number;
  weight: number;
};

const READINESS_TARGET = 0.8;
const RECENCY_HALF_LIFE_DAYS = 60;

function attemptWeight(createdAt: string, now: number) {
  const timestamp = new Date(createdAt).getTime();
  if (!now || !Number.isFinite(timestamp)) return 1;

  const ageDays = Math.max(0, (now - timestamp) / 86_400_000);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

function getWeightedAttemptStats(attempts: QuestionAttempt[], now: number) {
  let weight = 0;
  let weightedCorrect = 0;

  for (const attempt of attempts) {
    if (attempt.selected_answer === null) continue;
    const currentWeight = attemptWeight(attempt.created_at, now);
    weight += currentWeight;
    if (attempt.is_correct) weightedCorrect += currentWeight;
  }

  return {
    weight,
    weightedCorrect,
    rate: weight ? weightedCorrect / weight : null,
  };
}

function getWeightedMockAverage(mocks: Awaited<ReturnType<typeof getProgressData>>["mockTests"], now: number) {
  let totalWeight = 0;
  let weightedPercentage = 0;

  for (const mock of mocks) {
    const weight = attemptWeight(mock.created_at, now);
    totalWeight += weight;
    weightedPercentage += mock.percentage * weight;
  }

  return totalWeight ? Math.round(weightedPercentage / totalWeight) : 0;
}

function getAdditionalCorrectAnswers(topic: TopicRow, target: number) {
  if (!topic.weight) return 1;
  const smoothedWeight = topic.weight + 2;
  const smoothedCorrect = topic.weightedCorrect + 1;
  return Math.max(0, Math.ceil((target * smoothedWeight - smoothedCorrect) / (1 - target)));
}

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

function localDateKey(value: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Dublin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }
}

function shiftLocalDay(date: Date, days: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const shifted = new Date(
    Number(parts.find((part) => part.type === "year")?.value),
    Number(parts.find((part) => part.type === "month")?.value) - 1,
    Number(parts.find((part) => part.type === "day")?.value),
  );
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function getStreak(attempts: QuestionAttempt[], protectedDates: string[] = [], timezone = "Europe/Dublin") {
  const days = new Set(
    attempts
      .filter((attempt) => attempt.selected_answer !== null)
      .map((attempt) => localDateKey(new Date(attempt.created_at), timezone)),
  );
  const activeDays = new Set([...days, ...protectedDates]);

  const today = localDateKey(new Date(), timezone);
  const yesterday = localDateKey(shiftLocalDay(new Date(), -1, timezone), timezone);

  let current = 0;
  let cursor: Date | null = null;

  if (activeDays.has(today)) cursor = new Date();
  else if (activeDays.has(yesterday)) cursor = shiftLocalDay(new Date(), -1, timezone);

  if (cursor) {
    while (activeDays.has(localDateKey(cursor, timezone))) {
      current += 1;
      cursor = shiftLocalDay(cursor, -1, timezone);
    }
  }

  let best = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const key of [...activeDays].sort()) {
    const day = new Date(key + "T00:00:00");
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

function TestReadiness({ attempts, mocks, topics, topicCoverage, now }: {
  attempts: QuestionAttempt[];
  mocks: Awaited<ReturnType<typeof getProgressData>>["mockTests"];
  topics: TopicRow[];
  topicCoverage: number;
  now: number;
}) {
  const overallStats = getWeightedAttemptStats(attempts, now);
  const accuracy = Math.round((overallStats.rate ?? 0) * 100);
  const mockAverage = getWeightedMockAverage(mocks, now);
  const score = Math.round(accuracy * 0.45 + mockAverage * 0.35 + topicCoverage * 0.2);
  const practicedTopics = topics.filter((topic) => topic.masteryRate !== null);
  const weakestTopic = [...practicedTopics]
    .sort((a, b) => (a.masteryRate ?? 0) - (b.masteryRate ?? 0) || a.percent - b.percent)[0];
  const recommendedTopic = weakestTopic ?? [...topics].sort((a, b) => a.percent - b.percent)[0];
  const strongestTopic = [...practicedTopics]
    .sort((a, b) => (b.masteryRate ?? 0) - (a.masteryRate ?? 0) || b.percent - a.percent)[0];
  const target = (recommendedTopic?.masteryRate ?? 0) < READINESS_TARGET ? READINESS_TARGET : 0.9;
  const targetPercent = Math.round(target * 100);
  const additionalCorrect = recommendedTopic ? getAdditionalCorrectAnswers(recommendedTopic, target) : 0;
  const masteryPercent = Math.round((recommendedTopic?.masteryRate ?? 0) * 100);

  return (
    <section className="progress-feature-card readiness-card" aria-labelledby="test-readiness-title">
      <div className="readiness-overview">
        <h2 id="test-readiness-title">You&apos;re {score}% ready.</h2>
        <p>This indicator reflects your TheoryPrep practice history, recent mock results and course coverage. It is not a prediction of your real exam result.</p>
      </div>
      <div className="readiness-gauge" role="img" aria-label={score + "% practice readiness"}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="readiness-gauge-track" cx="50" cy="50" r="43" />
          <circle className="readiness-gauge-progress" cx="50" cy="50" r="43" style={{ strokeDashoffset: 270.18 * (1 - score / 100) }} />
        </svg>
        <span>{score}<small>%</small></span>
      </div>

      <section className="readiness-focus" aria-label="Recommended topic practice">
        <div className="readiness-focus-heading">
          <div>
            <p className="eyebrow eyebrow-status">Next focus</p>
            <h3>{recommendedTopic?.name ?? "Build your topic history"}</h3>
          </div>
          <strong>{masteryPercent}%<span> mastery</span></strong>
        </div>
        <div className="readiness-topic-bar" role="progressbar" aria-label={(recommendedTopic?.name ?? "Topic") + " mastery"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={masteryPercent}>
          <span style={{ width: masteryPercent + "%" }} />
        </div>
        <p className="readiness-milestone">
          {recommendedTopic
            ? recommendedTopic.masteryRate === null
              ? `Answer ${additionalCorrect} question correctly to start building toward ${targetPercent}% mastery.`
              : additionalCorrect
                ? `${additionalCorrect} more correct ${additionalCorrect === 1 ? "answer" : "answers"} to reach ${targetPercent}% mastery.`
                : `You've reached the ${targetPercent}% mastery milestone. Keep practising to reinforce it.`
            : "Start practising a topic to build your personal readiness indicator."}
        </p>
        {recommendedTopic && (
          <Link className="button button-primary readiness-practice-link" href={"/practice?category=" + encodeURIComponent(recommendedTopic.name)}>
            Practice <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>

      <div className="readiness-facts">
        <span>{accuracy}% recent weighted accuracy</span>
        <span>{mockAverage}% recent mock average</span>
        <span>{topicCoverage}% topic coverage</span>
        {strongestTopic && <span>Strongest: {strongestTopic.name} ({strongestTopic.mastery}%)</span>}
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
                <span className="dashboard-mistake-marker" aria-hidden="true">×</span>
                <div className="dashboard-mistake-copy">
                  <strong>{question.question}</strong>
                  <small>{question.taxonomy.category ?? "General"} · Question {question.id}</small>
                </div>
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
  const [protection, setProtection] = useState<Awaited<ReturnType<typeof getStreakProtection>> | null>(null);
  const [readinessAsOf, setReadinessAsOf] = useState<number | null>(null);

  useEffect(() => {
    getProgressData(2000).then(async (nextData) => {
      setData(nextData);
      setReadinessAsOf(Date.now());
      if (nextData.user) setProtection(await getStreakProtection());
    });
  }, []);

  const chapters = useMemo(() => getCourseChapters(), []);
  const courseProgress = useMemo(() => getCourseProgress(data?.attempts ?? []), [data?.attempts]);
  const nextLesson = useMemo(() => getNextCourseLesson(data?.attempts ?? []), [data?.attempts]);
  const streak = useMemo(
    () => getStreak(
      data?.attempts ?? [],
      protection?.protected_dates ?? [],
      protection?.reminder_timezone || "Europe/Dublin",
    ),
    [data?.attempts, protection?.protected_dates, protection?.reminder_timezone],
  );

  const topics = useMemo<TopicRow[]>(() => {
    const now = readinessAsOf ?? 0;
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
        const masteryStats = getWeightedAttemptStats(chapterAttempts, now);

        return {
          name: chapter.name,
          seen: chapterProgress.seenCount,
          total: chapterProgress.total,
          percent: chapterProgress.percent,
          accuracy: chapterAttempts.length ? Math.round((correct / chapterAttempts.length) * 100) : null,
          attempts: [...questionIds].reduce((total, id) => total + (attemptedByQuestion.get(id) ?? 0), 0),
          mastery: masteryStats.rate === null ? null : Math.round(((masteryStats.weightedCorrect + 1) / (masteryStats.weight + 2)) * 100),
          masteryRate: masteryStats.rate === null ? null : (masteryStats.weightedCorrect + 1) / (masteryStats.weight + 2),
          weightedCorrect: masteryStats.weightedCorrect,
          weight: masteryStats.weight,
        };
      })
      .filter((topic) => topic.total > 0)
      .sort((a, b) => {
        if (a.accuracy !== null && b.accuracy !== null && Math.abs(a.accuracy - b.accuracy) >= 1) {
          return a.accuracy - b.accuracy;
        }
        return a.percent - b.percent;
      });
  }, [chapters, data?.attempts, courseProgress.seen, readinessAsOf]);

  const answered = (data?.attempts ?? []).filter((attempt) => attempt.selected_answer !== null);
  const correct = answered.filter((attempt) => attempt.is_correct).length;
  const accuracy = answered.length ? Math.round((correct / answered.length) * 100) : 0;
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

        <TestReadiness attempts={data.attempts} mocks={data.mockTests} topics={topics} topicCoverage={topicCoverage} now={readinessAsOf ?? 0} />

        <div className="dashboard-grid">
          <TopicProgress topics={topics} />
          <div className="dashboard-stack">
            <RecentMocks mocks={data.mockTests} />
            <RecentMistakes questionIds={latestMistakes} />
          </div>
        </div>

        <section className="dashboard-actions-card">
          <div>
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
