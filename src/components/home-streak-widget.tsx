"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProgressData, type QuestionAttempt } from "@/lib/progress";

function getStreak(attempts: QuestionAttempt[]) {
  const days = new Set(attempts.map((attempt) => attempt.created_at.slice(0, 10)));
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let current = 0;

  while (true) {
    const key = start.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    current += 1;
    start.setDate(start.getDate() - 1);
  }

  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of [...days].sort()) {
    const day = new Date(key + "T00:00:00Z");
    if (previous && day.getTime() - previous.getTime() === 86400000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best, days };
}

function getWeekActivity(days: Set<string>) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - 6);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-IE", { weekday: "narrow" }).format(date),
      active: days.has(date.toISOString().slice(0, 10)),
      today: index === 6,
    };
  });
}

export function HomeStreakWidget() {
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  useEffect(() => { getProgressData().then(setProgress); }, []);
  if (!progress?.user || !progress.available) return null;

  const streak = getStreak(progress.attempts);
  const week = getWeekActivity(streak.days);
  const answered = progress.attempts.filter((attempt) => attempt.selected_answer !== null).length;
  const todayActive = week[week.length - 1].active;

  return (
    <section className="home-streak-section" aria-label="Your TheoryTester streak">
      <div className="home-streak-inner">
        <div className="home-streak-copy">
          <div className="home-streak-icon" aria-hidden="true">🔥</div>
          <div>
            <p className="eyebrow">Your practice streak</p>
            <h2>{streak.current > 0 ? streak.current + " day" + (streak.current === 1 ? "" : "s") + " strong." : "Start your streak today."}</h2>
            <p>{streak.current > 0 ? (todayActive ? "Nice work. Keep the run going." : "Answer a few questions today to keep it alive.") : "Answer a few questions today and make day one count."}</p>
          </div>
        </div>

        <div className="home-streak-week" aria-label="Your activity over the last seven days">
          {week.map((day) => <div className="home-streak-day" key={day.key}><span>{day.label}</span><i className={day.active ? "home-streak-dot home-streak-dot-active" : "home-streak-dot"} /></div>)}
        </div>

        <div className="home-streak-stats"><span><strong>{streak.best}</strong> day best</span><span><strong>{answered}</strong> questions answered</span></div>
        <Link className="home-streak-link" href="/progress">View my progress <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
