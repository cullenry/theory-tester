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
              Work through the full question bank in small lessons. Answer, see why, and revisit the ones that catch you out.
              The goal is simple: turn 805 unfamiliar questions into things you can recognise on test day.
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

        {data.user === null && (
          <section className="course-signin-strip">
            <div>
              <p className="eyebrow">Save your place</p>
              <strong>Sign in to keep course progress across devices.</strong>
              <span>You can still start learning right away.</span>
            </div>
            <Link className="button button-secondary" href="/login?next=/practice/learn">Sign in</Link>
          </section>
        )}

        <section className="course-next-card">
          <div>
            <p className="eyebrow">{complete ? "Course complete" : hasStarted ? "Continue your journey" : "Your first lesson"}</p>
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
            href={next ? `/practice/learn/lesson?chapter=${next.chapterIndex}&lesson=${next.lessonIndex}` : "/practice"}
          >
            {complete ? "Review the course" : hasStarted ? "Continue learning" : "Start the course"} <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="course-how-card" aria-labelledby="course-method-title">
          <div>
            <p className="eyebrow">Small lessons, not a textbook</p>
            <h2 id="course-method-title">Learn it. Check it. Lock it in.</h2>
          </div>
          <div className="course-method-steps">
            <div><span>01</span><strong>Recall</strong><small>Try the answer before revealing anything.</small></div>
            <div><span>02</span><strong>Understand</strong><small>Get instant feedback and an explanation.</small></div>
            <div><span>03</span><strong>Revisit</strong><small>Miss one and it comes back before the lesson ends.</small></div>
          </div>
        </section>

        <details className="course-map">
          <summary>
            <span><span className="eyebrow">Course map</span><strong>{chapters.length} chapters · {progress.total} questions</strong></span>
            <span>View chapters <span aria-hidden="true">⌄</span></span>
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
