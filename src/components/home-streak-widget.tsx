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

function ProtectionIcon() {
  return (
    <span className="home-streak-protection-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 3.5 19 6v5.3c0 4.2-2.7 7.3-7 9.2-4.3-1.9-7-5-7-9.2V6l7-2.5Z" />
        <path d="m9.1 12.2 1.9 1.9 4.1-4.3" />
      </svg>
    </span>
  );
}

function StreakProtectionRow({
  protection,
  currentStreak,
  onChange,
}: {
  protection: StreakProtectionState;
  currentStreak: number;
  onChange: (next: StreakProtectionState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function activate() {
    setBusy(true);
    setMessage("");
    const next = await activateStreakProtection();
    if (next) {
      onChange(next);
      setMessage("Your next missed day is protected.");
    } else {
      setMessage("That protection could not be activated. Please try again.");
    }
    setBusy(false);
  }

  async function deactivate() {
    setBusy(true);
    setMessage("");
    const next = await deactivateStreakProtection();
    if (next) {
      onChange(next);
      setMessage("Protection returned to your balance.");
    } else {
      setMessage("That protection could not be changed. Please try again.");
    }
    setBusy(false);
  }

  const available = protection.streak_shields;
  const canActivate = available > 0 && currentStreak > 0 && !protection.streak_protection_active;

  return (
    <div className="home-streak-protection" id="streak-protection">
      <div className="home-streak-protection-copy">
        <ProtectionIcon />
        <div>
          <p className="eyebrow">Streak protection</p>
          {protection.streak_protection_active ? (
            <>
              <strong>Your next missed day is protected.</strong>
              <small>No action needed. Practise normally and the protection only gets used if you miss a day.</small>
            </>
          ) : available > 0 ? (
            <>
              <strong>{available} protection{available === 1 ? "" : "s"} ready.</strong>
              <small>Earn more by answering 20 practice questions in a day or completing a mock test.</small>
            </>
          ) : (
            <>
              <strong>No protection ready yet.</strong>
              <small>Complete a mock test or answer 20 practice questions in a day to earn one.</small>
            </>
          )}
        </div>
      </div>

      <div className="home-streak-protection-actions">
        {protection.streak_protection_active ? (
          <div className="home-streak-protection-active-wrap">
            <span className="home-streak-protection-active-label">
              {busy ? "Saving…" : "Active"}
            </span>
            <button
              className="home-streak-protection-release"
              type="button"
              onClick={() => void deactivate()}
              disabled={busy}
            >
              Release
            </button>
          </div>
        ) : available > 0 ? (
          <button
            className="home-streak-protection-button"
            type="button"
            onClick={() => void activate()}
            disabled={busy || !canActivate}
            title={!currentStreak ? "Start a practice streak before activating protection." : undefined}
          >
            {busy ? "…" : canActivate ? "Activate" : "Start streak"}
          </button>
        ) : null}
        <span className="home-streak-protection-count" aria-label={available + " unused protections"}>
          {available} left
        </span>
      </div>

      {message && <span className="home-streak-protection-message" role="status">{message}</span>}
    </div>
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
          <div className="home-streak-icon" aria-hidden="true">🔥</div>
          <div>
            <p className="eyebrow">Your practice streak</p>
            <h2>{streak.current > 0 ? streak.current + " day" + (streak.current === 1 ? "" : "s") + " strong." : "Start your streak today."}</h2>
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

        {protection ? (
          <StreakProtectionRow
            protection={protection}
            currentStreak={streak.current}
            onChange={setProtection}
          />
        ) : null}
      </div>
    </section>
  );
}
