"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "theorytester-exam-date";

function getDaysUntil(dateValue: string) {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

function formatExamDate(dateValue: string) {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(dateValue + "T12:00:00"));
}

export function HomeExamCountdown() {
  const [examDate, setExamDate] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      setExamDate(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      setExamDate("");
    }
  }, []);

  const days = useMemo(() => getDaysUntil(examDate), [examDate]);

  function saveDate(value: string) {
    setExamDate(value);
    setEditing(false);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The countdown still works for this session if storage is unavailable.
    }
  }

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
            <label className="home-exam-date-control">
              <span>Test date</span>
              <input type="date" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => saveDate(event.target.value)} aria-label="Choose your theory test date" />
            </label>
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
              <button className="button button-secondary home-exam-change" type="button" onClick={() => setEditing(true)}>Change date</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
