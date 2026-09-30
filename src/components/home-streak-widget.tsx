"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProgressData, type QuestionAttempt } from "@/lib/progress";
import {
  activateStreakProtection,
  deactivateStreakProtection,
  getStreakProtection,
  type StreakProtectionState,
} from "@/lib/streak-protection";

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

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  const shifted = new Date(year, month - 1, day);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function getStreak(attempts: QuestionAttempt[], protectedDates: string[], timezone: string) {
  const days = new Set(
    attempts
      .filter((attempt) => attempt.selected_answer !== null)
      .map((attempt) => localDateKey(new Date(attempt.created_at), timezone)),
  );
  const activeDays = new Set([...days, ...protectedDates]);

  const today = localDateKey(new Date(), timezone);
  const yesterday = localDateKey(shiftLocalDay(new Date(), -1, timezone), timezone);

  let current = 0;
  let cursorDate: Date | null = null;

  if (activeDays.has(today)) cursorDate = new Date();
  else if (activeDays.has(yesterday)) cursorDate = shiftLocalDay(new Date(), -1, timezone);

  if (cursorDate) {
    while (activeDays.has(localDateKey(cursorDate, timezone))) {
      current += 1;
      cursorDate = shiftLocalDay(cursorDate, -1, timezone);
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

  return { current, best, days, protectedDates: new Set(protectedDates), today, yesterday };
}

function getWeekActivity(
  days: Set<string>,
  protectedDates: Set<string>,
  timezone: string,
) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const now = new Date();
  const todayValue = localDateKey(now, timezone);
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const today = new Date(
    Number(todayParts.find((part) => part.type === "year")?.value),
    Number(todayParts.find((part) => part.type === "month")?.value) - 1,
    Number(todayParts.find((part) => part.type === "day")?.value),
  );
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - daysFromMonday);

  return labels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = localDateKey(date, timezone);
    const isFuture = date.getTime() > today.getTime();

    return {
      key,
      label,
      active: !isFuture && days.has(key),
      protected: !isFuture && protectedDates.has(key),
      today: key === todayValue,
      future: isFuture,
    };
  });
}

function StreakIcon() {
  return (
    <svg className="home-streak-flame" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13.8 3.7c.1 2.5-.8 4-2.3 5.5-1.3 1.3-2.5 2.5-2.5 4.6a5.4 5.4 0 0 0 1.5 3.8 4.3 4.3 0 0 1 .2-3.1c.4-.9 1.1-1.7 2-2.5.8 1.2 1.7 2.5 1.7 4.2 0 1-.2 2-.7 2.7a5.8 5.8 0 0 0 4.4-5.7c0-3.5-2.4-6.2-4.3-9.5Z" />
      <path d="M9.2 17.4c.3 1.9 1.4 3 2.8 3.2" />
    </svg>
  );
}

function LockedStreakWidget() {
  const previewDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <section className="home-streak-section" aria-label="Your TheoryPrep streak">
      <div className="home-streak-inner home-streak-locked">
        <div className="home-streak-locked-blur" aria-hidden="true">
          <div className="home-streak-copy">
            <div className="home-streak-icon"><StreakIcon /></div>
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

function ProtectionIcon() {
  return (
    <span className="home-streak-protection-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 3.5 19 6v5.3c0 4.2-2.7 7.3-7 9.2-4.3-1.9-7-5-7-9.2V6l7-2.5Z" />
        <path d="m8.9 12.3 2 1.9 4.2-4.4" />
      </svg>
    </span>
  );
}


function StreakProtectionAction({
  protection,
  currentStreak,
  onChange,
}: {
  protection: StreakProtectionState;
  currentStreak: number;
  onChange: (next: StreakProtectionState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const available = protection.streak_shields;
  const active = protection.streak_protection_active;
  const canActivate = available > 0 && currentStreak > 0 && !active;

  async function activate() {
    setBusy(true);
    const next = await activateStreakProtection();
    if (next) onChange(next);
    setBusy(false);
  }

  async function deactivate() {
    setBusy(true);
    const next = await deactivateStreakProtection();
    if (next) onChange(next);
    setBusy(false);
  }

  if (active) {
    return (
      <button
        className="home-streak-protection-chip home-streak-protection-chip-active"
        type="button"
        onClick={() => void deactivate()}
        disabled={busy}
        aria-label="Streak protection is active. Release it to return it to your balance."
      >
        <ProtectionIcon />
        <span>{busy ? "Saving…" : "Protected"}</span>
      </button>
    );
  }

  if (available > 0) {
    return (
      <button
        className="home-streak-protection-chip"
        type="button"
        onClick={() => void activate()}
        disabled={busy || !canActivate}
        title={!currentStreak ? "Start a practice streak before using streak protection." : undefined}
      >
        <ProtectionIcon />
        <span>{busy ? "Saving…" : "Use protection"}</span>
        <small>{available} left</small>
      </button>
    );
  }

  return (
    <Link className="home-streak-protection-chip home-streak-protection-chip-muted" href="/practice">
      <ProtectionIcon />
      <span>Earn protection</span>
    </Link>
  );
}

export function HomeStreakWidget() {
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  const [protection, setProtection] = useState<StreakProtectionState | null>(null);

  useEffect(() => {
    let mounted = true;

    getProgressData().then(async (data) => {
      if (!mounted) return;
      setProgress(data);

      if (data.user) {
        const nextProtection = await getStreakProtection();
        if (mounted) setProtection(nextProtection);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!progress) return null;
  if (!progress.user) return <LockedStreakWidget />;
  if (!progress.available) return null;

  const timezone = protection?.reminder_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Dublin";
  const streak = getStreak(progress.attempts, protection?.protected_dates ?? [], timezone);
  const week = getWeekActivity(streak.days, streak.protectedDates, timezone);
  const answered = progress.attempts.filter((attempt) => attempt.selected_answer !== null).length;
  const todayActive = week[week.length - 1].active;
  const activeProtection = protection?.streak_protection_active ?? false;

  return (
    <section className="home-streak-section" aria-label="Your TheoryPrep streak">
      <div className="home-streak-inner home-streak-with-protection">
        <div className="home-streak-copy">
          <div className="home-streak-icon"><StreakIcon /></div>
          <div>
            <p className="eyebrow">Your practice streak</p>
            <div className="home-streak-title-row">
              <h2>{streak.current > 0 ? streak.current + " day" + (streak.current === 1 ? "" : "s") + " strong." : "Start your streak today."}</h2>
              {protection ? (
                <StreakProtectionAction
                  protection={protection}
                  currentStreak={streak.current}
                  onChange={setProtection}
                />
              ) : null}
            </div>
            <p>
              {activeProtection && !todayActive
                ? "Your protection is ready for a missed day. Practise today to keep the run moving."
                : streak.current > 0
                  ? todayActive
                    ? "Nice work. Keep the run going."
                    : "Answer a few questions today to keep it alive."
                  : "Answer a few questions today and make day one count."}
            </p>
          </div>
        </div>

        <div className="home-streak-week" aria-label="Your activity over the last seven days">
          {week.map((day) => (
            <div className="home-streak-day" key={day.key}>
              <span>{day.label}</span>
              <i
                className={
                  day.protected
                    ? "home-streak-dot home-streak-dot-protected"
                    : day.active
                      ? "home-streak-dot home-streak-dot-active"
                      : day.today
                        ? "home-streak-dot home-streak-dot-today"
                        : "home-streak-dot home-streak-dot-missed"
                }
                aria-label={day.protected ? "Protected day" : day.active ? "Practised" : day.future ? "Upcoming" : "Missed"}
              />
            </div>
          ))}
        </div>

        <div className="home-streak-stats">
          <span><strong>{streak.best}</strong> day best</span>
          <span><strong>{answered}</strong> questions answered</span>
        </div>

        <Link className="home-streak-link" href="/progress">
          View my progress <span aria-hidden="true">↗</span>
        </Link>


      </div>
    </section>
  );
}
