"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser-only state initialization is intentionally performed after hydration. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgressData } from "@/lib/progress";
import { getAppPreferences } from "@/lib/app-preferences";

const GOALS = [
  { id: "answered", title: "Answer 20 questions", target: 20 },
  { id: "correct", title: "Get 16 correct", target: 16 },
  { id: "learn", title: "Complete a Learn session", target: 1 },
] as const;

function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function DailyMission() {
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  const [learnDone, setLearnDone] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(20);

  useEffect(() => {
    getProgressData(2000).then(setProgress);
    getAppPreferences().then((preferences) => setDailyGoal(preferences.daily_goal));
  }, []);

  useEffect(() => {
    if (!progress?.user) return;
    const today = localDateKey(new Date());
    setLearnDone(localStorage.getItem("theorytester-learn-completed-" + progress.user.id) === today);
  }, [progress?.user?.id]);

  const todayStats = useMemo(() => {
    if (!progress) return { answered: 0, correct: 0 };
    const today = localDateKey(new Date());
    const attempts = progress.attempts.filter((attempt) => localDateKey(attempt.created_at) === today && attempt.selected_answer !== null);
    return {
      answered: attempts.length,
      correct: attempts.filter((attempt) => attempt.is_correct).length,
    };
  }, [progress]);

  if (!progress) return null;

  if (!progress.user || !progress.available) {
    return (
      <section className="daily-mission-section" aria-label="Daily mission">
        <div className="daily-mission-card daily-mission-locked">
          <div><p className="eyebrow">Today’s mission</p><h2>Build a little momentum</h2><p>Sign in to track your daily questions, accuracy and Learn sessions.</p></div>
          <Link className="button button-secondary" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    );
  }

  const goals = [
    { id: "answered", title: "Answer " + dailyGoal + " questions", target: dailyGoal },
    { id: "correct", title: "Get " + Math.round(dailyGoal * 0.8) + " correct", target: Math.round(dailyGoal * 0.8) },
    GOALS[2],
  ] as const;

  const status = {
    answered: Math.min(goals[0].target, todayStats.answered),
    correct: Math.min(goals[1].target, todayStats.correct),
    learn: learnDone ? 1 : 0,
  };
  const completed = goals.filter((goal) => status[goal.id] >= goal.target).length;

  return (
    <section className="daily-mission-section" aria-label="Daily mission">
      <div className="daily-mission-card">
        <div className="daily-mission-header">
          <div><p className="eyebrow">Today’s mission</p><h2>Three small wins</h2></div>
          <span className="daily-mission-count">{completed}/{goals.length} complete</span>
        </div>
        <div className="daily-mission-grid">
          {goals.map((goal) => {
            const value = status[goal.id];
            const done = value >= goal.target;
            return <div className={done ? "daily-mission-goal daily-mission-goal-done" : "daily-mission-goal"} key={goal.id}>
              <span aria-hidden="true">{done ? "✓" : "○"}</span>
              <div><strong>{goal.title}</strong><small>{goal.id === "answered" ? `${value}/${goal.target} today` : goal.id === "correct" ? `${value}/${goal.target} today` : done ? "Completed today" : "Not completed yet"}</small></div>
            </div>;
          })}
        </div>
        <div className="daily-mission-progress"><span style={{ width: `${(completed / GOALS.length) * 100}%` }} /></div>
        <div className="daily-mission-actions">
          {status.learn === 0 && <Link className="button button-primary" href="/practice/learn">Learn <span aria-hidden="true">→</span></Link>}
          {status.learn === 1 && status.answered < goals[0].target && <Link className="button button-primary" href="/practice">Answer more questions <span aria-hidden="true">→</span></Link>}
          {completed === goals.length && <Link className="button button-secondary" href="/progress">View your progress <span aria-hidden="true">→</span></Link>}
        </div>
      </div>
    </section>
  );
}
