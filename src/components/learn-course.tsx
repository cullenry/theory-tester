"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgressData } from "@/lib/progress";
import {
  getChapterProgress,
  getCourseChapters,
  getCourseProgress,
  getNextCourseLesson,
} from "@/lib/course";

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

export function LearnCourse() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);

  useEffect(() => {
    getProgressData(2000).then(setData);
  }, []);

  const chapters = useMemo(() => getCourseChapters(), []);
  const progress = useMemo(() => getCourseProgress(data?.attempts ?? []), [data?.attempts]);
  const next = useMemo(() => getNextCourseLesson(data?.attempts ?? []), [data?.attempts]);

  if (!data) {
    return (
      <main className="app-main">
        <div className="page-shell course-shell">
          <div className="course-loading">Building your course map…</div>
        </div>
      </main>
    );
  }

  const firstName = data.user ? getDisplayName(data.user).split(" ")[0] : "there";
  const hasStarted = progress.seenCount > 0;
  const complete = progress.seenCount >= progress.total;

  return (
    <main className="app-main">
      <div className="page-shell course-shell">
        <section className="course-hero">
          <div className="course-hero-copy">
            <p className="eyebrow">Learn from the ground up</p>
            <h1>{data.user ? `Hi, ${firstName}. Let’s learn the road.` : "Learn the Irish theory test."}</h1>
            <p>
              Work through the full question bank in short lessons, with explanations and focused review built around the questions you find hardest.
            </p>
          </div>

          <div className="course-hero-progress" aria-label={`${progress.seenCount} of ${progress.total} questions covered`}>
            <span className="course-progress-ring">{progress.percent}<small>%</small></span>
            <div>
              <strong>{progress.seenCount} / {progress.total}</strong>
              <span>questions covered</span>
            </div>
          </div>
        </section>

        {data.user === null ? (
          <section className="course-next-card course-signin-lesson-card" aria-labelledby="first-lesson-title">
            <div>
              <p className="eyebrow">Your first lesson</p>
              <h2 id="first-lesson-title">Start learning with TheoryPrep.</h2>
              <p>Sign in to start your lessons and let your answers shape what you see next.</p>
            </div>
            <Link
              className="button button-primary"
              href="/login?next=/practice/learn"
            >
              Sign in to start <span aria-hidden="true">→</span>
            </Link>
          </section>
        ) : (
          <section className="course-next-card">
            <div>
              <p className="eyebrow">{complete ? "Course complete" : "Continue your journey"}</p>
              <h2>
                {complete
                  ? "You’ve covered the whole question bank."
                  : next
                    ? next.chapter.name
                    : "Ready to start?"}
              </h2>
              <p>
                {complete
                  ? "Every question has been brought into your learning journey. Use the course map to revisit any chapter."
                  : next
                    ? `Lesson ${next.lessonIndex + 1} of ${next.chapter.lessons.length} · ${next.lesson.questionIds.length} quick questions`
                    : "Start with a short lesson and build from there."}
              </p>
            </div>
            <Link
              className="button button-primary"
              href={next ? `/practice/learn/lesson?chapter=${next.chapterIndex}&lesson=${next.lessonIndex}` : "/practice/learn"}
            >
              {complete ? "Review the course" : "Continue learning"} <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        <section className="course-adaptive-card" aria-labelledby="adaptive-learning-title">
          <div className="course-adaptive-heading">
            <div>
              <p className="eyebrow">Adaptive Learn</p>
              <h2 id="adaptive-learning-title">Your lessons adjust as you practise.</h2>
              <p>
                TheoryPrep uses your previous answers to shape the order of questions, so difficult material gets more attention while stronger answers are spaced out for later recall.
              </p>
            </div>
            <span className="course-adaptive-badge" aria-hidden="true">SMART</span>
          </div>
          <div className="course-adaptive-pills">
            <span><i aria-hidden="true">01</i><strong>Weak spots first</strong><small>Prioritise topics and questions you struggle with.</small></span>
            <span><i aria-hidden="true">02</i><strong>Reinforce over time</strong><small>Bring questions back after time has passed.</small></span>
            <span><i aria-hidden="true">03</i><strong>Second chances</strong><small>Miss one and it returns before the lesson ends.</small></span>
          </div>
        </section>

        <details className="course-map">
          <summary>
            <span><span className="eyebrow">Course map</span><strong>{chapters.length} chapters · {progress.total} questions</strong></span>
            <span className="course-map-toggle">View chapters <span className="course-map-chevron" aria-hidden="true" /></span>
          </summary>
          <div className="course-chapter-list">
            {chapters.map((chapter) => {
              const chapterProgress = getChapterProgress(chapter, progress.seen);
              const active = next?.chapterIndex === chapter.index;

              return (
                <Link
                  className={active ? "course-chapter course-chapter-active" : "course-chapter"}
                  href={`/practice/learn/lesson?chapter=${chapter.index}&lesson=0`}
                  key={chapter.id}
                >
                  <span className="course-chapter-number">{String(chapter.index + 1).padStart(2, "0")}</span>
                  <div className="course-chapter-copy">
                    <strong>{chapter.name}</strong>
                    <span>{chapter.count} questions · {chapter.lessons.length} lessons</span>
                    <span className="course-mini-bar"><i style={{ width: chapterProgress.percent + "%" }} /></span>
                  </div>
                  <span className="course-chapter-progress">
                    {chapterProgress.seenCount === chapter.count ? "✓" : `${chapterProgress.percent}%`}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        </details>

        <div className="course-footer-actions">
          <Link className="button button-secondary" href="/questions">Browse all 805 questions</Link>
          <Link className="button button-quiet" href="/practice">Back to Learn &amp; Practice</Link>
        </div>
      </div>
    </main>
  );
}
