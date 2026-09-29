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

function LockedStreakWidget() {
  const previewDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <section className="home-streak-section" aria-label="Your TheoryPrep streak">
      <div className="home-streak-inner home-streak-locked">
        <div className="home-streak-locked-blur" aria-hidden="true">
          <div className="home-streak-copy">
            <div className="home-streak-icon">🔥</div>
            <div>
              <p className="eyebrow">Your practice streak</p>
              <h2>7 days strong.</h2>
              <p>Nice work. Keep the run going.</p>
            </div>
          </div>

          <div className="home-streak-week">
            {previewDays.map((day, index) => (
              <div className="home-streak-day" key={day + index}>
                <span>{day}</span>
                <i className="home-streak-dot home-streak-dot-active" />
              </div>
            ))}
          </div>

          <div className="home-streak-stats">
            <span><strong>7</strong> day best</span>
            <span><strong>128</strong> questions answered</span>
          </div>

          <span className="home-streak-link">View my progress ↗</span>
        </div>

        <div className="home-streak-locked-overlay">
          <span className="home-streak-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="5.5" y="10" width="13" height="10" rx="2.2" />
              <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
            </svg>
          </span>
          <div>
            <p className="eyebrow">Make your practice count</p>
            <h2>Sign in to view your progress.</h2>
            <p>Your streaks, questions answered and practice history will appear here.</p>
          </div>
          <Link className="button button-primary home-streak-signin" href="/login">
            Sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeStreakWidget() {
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  useEffect(() => { getProgressData().then(setProgress); }, []);

  if (!progress) return null;
  if (!progress.user) return <LockedStreakWidget />;
  if (!progress.available) return null;

  const streak = getStreak(progress.attempts);
  const week = getWeekActivity(streak.days);
  const answered = progress.attempts.filter((attempt) => attempt.selected_answer !== null).length;
  const todayActive = week[week.length - 1].active;

  return (
    <section className="home-streak-section" aria-label="Your TheoryPrep streak">
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
