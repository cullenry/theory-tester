"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser-only state initialization is intentionally performed after hydration. */

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "theorytester-exam-date";
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function toDateValue(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function fromDateValue(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDaysUntil(dateValue: string) {
  const target = fromDateValue(dateValue);
  if (!target) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

function formatExamDate(dateValue: string) {
  const date = fromDateValue(dateValue);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCalendarDays(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => ({
    date: new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1),
    inMonth: true,
  }));

  // Keep the first day aligned with the weekday header without showing
  // dates from the previous or next month.
  return [
    ...Array.from({ length: startOffset }, () => ({ date: null, inMonth: false })),
    ...days,
  ];
}

export function HomeExamCountdown() {
  const [examDate, setExamDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) ?? "";
      // eslint-disable-next-line react-hooks/set-state-in-effect\n      setExamDate(saved);
      const savedDate = fromDateValue(saved);
      if (savedDate) {\n        // eslint-disable-next-line react-hooks/set-state-in-effect\n        setViewMonth(new Date(savedDate.getFullYear(), savedDate.getMonth(), 1));\n      }
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect\n      setExamDate("");
    }
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCalendarOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [calendarOpen]);

  const days = useMemo(() => getDaysUntil(examDate), [examDate]);
  const todayValue = toDateValue(new Date());
  const calendarDays = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);

  function saveDate(value: string) {
    setExamDate(value);
    setCalendarOpen(false);
    setEditing(false);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The countdown still works for this session if storage is unavailable.
    }
  }

  function openDatePicker() {
    const selected = fromDateValue(examDate);
    setViewMonth(selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date());
    setCalendarOpen(true);
  }

  const monthLabel = new Intl.DateTimeFormat("en-IE", {
    month: "long",
    year: "numeric",
  }).format(viewMonth);

  return (
    <section className="home-exam-section" aria-label="Exam countdown">
      <div className="home-exam-card">
        {!examDate || editing ? (
          <div className="home-exam-setup">
            <div>
              <p className="eyebrow">Your test day</p>
              <h2>Keep the date in sight.</h2>
              <p>Set your theory test date and we’ll show you how long you have left.</p>
            </div>

            <div className="home-exam-picker" ref={calendarRef}>
              <span className="home-exam-picker-label">Test date</span>
              <button
                className={calendarOpen ? "home-exam-date-trigger home-exam-date-trigger-open" : "home-exam-date-trigger"}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
                onClick={openDatePicker}
              >
                <span>{examDate ? formatExamDate(examDate) : "Choose a date"}</span>
                <span className="home-exam-calendar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <rect x="4.5" y="5.5" width="15" height="14" rx="2.5" />
                    <path d="M8 3.5v4M16 3.5v4M4.5 10h15" />
                    <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01" />
                  </svg>
                </span>
              </button>

              {calendarOpen && (
                <div className="home-exam-calendar" role="dialog" aria-label="Choose your theory test date">
                  <div className="home-exam-calendar-header">
                    <div>
                      <span className="eyebrow">Test date</span>
                      <strong>{monthLabel}</strong>
                    </div>
                    <div className="home-exam-calendar-nav">
                      <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                      >←</button>
                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                      >→</button>
                    </div>
                  </div>

                  <div className="home-exam-calendar-week" aria-hidden="true">
                    {WEEKDAYS.map((day, index) => <span key={day + index}>{day}</span>)}
                  </div>

                  <div className="home-exam-calendar-grid">
                    {calendarDays.map(({ date, inMonth }, index) => {
                      if (!date) {
                        return <span className="home-exam-calendar-day-spacer" aria-hidden="true" key={`spacer-${index}`} />;
                      }

                      const value = toDateValue(date);
                      const selected = value === examDate;
                      const today = value === todayValue;
                      const disabled = value < todayValue;

                      return (
                        <button
                          key={value}
                          type="button"
                          className={[
                            "home-exam-calendar-day",
                            selected ? "home-exam-calendar-day-selected" : "",
                            today ? "home-exam-calendar-day-today" : "",
                          ].join(" ")}
                          disabled={disabled}
                          aria-label={date.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                          aria-pressed={selected}
                          onClick={() => saveDate(value)}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="home-exam-calendar-footer">
                    <button type="button" onClick={() => { setViewMonth(new Date()); saveDate(todayValue); }}>Today</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="home-exam-content">
            <div className="home-exam-copy">
              <p className="eyebrow">Your test day</p>
              <h2>{days === 0 ? "Test day is here." : days !== null && days > 0 ? String(days) + " day" + (days === 1 ? "" : "s") + " to go." : "Test date passed."}</h2>
              <p>{formatExamDate(examDate)}</p>
            </div>
            <div className="home-exam-actions">
              <div className="home-exam-date-badge" aria-label={String(days ?? 0) + " days until your test"}>
                <strong>{Math.max(0, days ?? 0)}</strong>
                <span>{days === 1 ? "day" : "days"}</span>
              </div>
              <button className="button button-secondary home-exam-change" type="button" onClick={() => { setEditing(true); openDatePicker(); }}>
                Change date
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
