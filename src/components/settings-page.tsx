
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAppPreferences, saveAppPreferences, type AppPreferences } from "@/lib/app-preferences";
import { createClient } from "@/lib/supabase/client";

const EXAM_DATE_KEY = "theorytester-exam-date";
const THEME_KEY = "theorytester-theme";

function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : "";

  if (metadataName) return metadataName;
  return user.email?.split("@")[0] ?? "Account";
}

export function SettingsPageClient() {
  const supabase = useMemo(() => createClient(), []);
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [user, setUser] = useState<{ email?: string | null; user_metadata?: Record<string, unknown> } | null>(null);
  const [examDate, setExamDate] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getAppPreferences(),
      supabase.auth.getUser(),
    ]).then(([prefs, result]) => {
      if (!mounted) return;
      setPreferences(prefs);
      setUser(result.data.user ? {
        email: result.data.user.email,
        user_metadata: result.data.user.user_metadata,
      } : null);
    });

    try {
      setExamDate(localStorage.getItem(EXAM_DATE_KEY) ?? "");
      setTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
    } catch {
      // Local settings are optional.
    }

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function updatePreference(
    label: string,
    patch: Partial<Pick<AppPreferences, "daily_goal" | "reminders_enabled" | "streak_guard_enabled">>,
  ) {
    setSaving(label);
    setMessage("");

    const next = await saveAppPreferences(patch);
    setSaving(null);

    if (next) {
      setPreferences(next);
      setMessage(label + " updated.");
    } else {
      setMessage("Couldn't update " + label.toLowerCase() + " right now.");
    }
  }

  function updateExamDate(value: string) {
    setExamDate(value);

    try {
      if (value) localStorage.setItem(EXAM_DATE_KEY, value);
      else localStorage.removeItem(EXAM_DATE_KEY);

      window.dispatchEvent(new CustomEvent("theoryprep-exam-date-change", { detail: value }));
      setMessage("Test date saved.");
    } catch {
      setMessage("Couldn't save the test date on this device.");
    }
  }

  function updateTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Theme still changes for this session.
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return;

    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteText }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(typeof body.error === "string" ? body.error : "Couldn't delete your account.");
        return;
      }

      try {
        await supabase.auth.signOut();
      } catch {
        // The account has already been deleted server-side.
      }

      window.location.href = "/";
    } catch {
      setMessage("Couldn't reach the account service. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (!preferences) {
    return (
      <main className="app-main">
        <div className="page-shell settings-shell">
          <div className="settings-loading">Loading your settings…</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-main">
        <div className="page-shell settings-shell">
          <section className="empty-state settings-login-state">
            <p className="eyebrow">Account settings</p>
            <h1>Sign in to manage your settings.</h1>
            <p>Your practice preferences and account controls are only available when you're signed in.</p>
            <Link className="button button-primary" href="/login?next=/settings">
              Sign in <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(user);

  return (
    <main className="app-main">
      <div className="page-shell settings-shell">
        <header className="settings-hero">
          <div>
            <p className="eyebrow">Your settings</p>
            <h1>Make TheoryPrep work your way.</h1>
            <p>Keep the useful bits personalised without changing how the core app works.</p>
          </div>
        </header>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">Practice</p>
              <h2>Your daily routine.</h2>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Daily question goal</strong>
              <span>Choose how many questions you want to aim for each day.</span>
            </div>
            <div className="settings-segmented" role="group" aria-label="Daily question goal">
              {[10, 20, 30].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={preferences.daily_goal === value ? "settings-choice settings-choice-active" : "settings-choice"}
                  onClick={() => void updatePreference("Daily goal", { daily_goal: value })}
                  disabled={saving === "Daily goal"}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Streak protection</strong>
              <span>Use reminders to help protect an active study streak.</span>
            </div>
            <button
              className={preferences.streak_guard_enabled ? "settings-toggle settings-toggle-on" : "settings-toggle"}
              type="button"
              role="switch"
              aria-checked={preferences.streak_guard_enabled}
              onClick={() => void updatePreference("Streak protection", { streak_guard_enabled: !preferences.streak_guard_enabled })}
              disabled={saving === "Streak protection"}
            >
              <span />
              {preferences.streak_guard_enabled ? "On" : "Off"}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <strong>Daily reminders</strong>
              <span>Allow TheoryPrep to send a gentle reminder when you have not practised that day.</span>
            </div>
            <button
              className={preferences.reminders_enabled ? "settings-toggle settings-toggle-on" : "settings-toggle"}
              type="button"
              role="switch"
              aria-checked={preferences.reminders_enabled}
              onClick={() => void updatePreference("Daily reminders", { reminders_enabled: !preferences.reminders_enabled })}
              disabled={saving === "Daily reminders"}
            >
              <span />
              {preferences.reminders_enabled ? "On" : "Off"}
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">App</p>
              <h2>Your setup.</h2>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Test day</strong>
              <span>This date powers the countdown shown on the home page.</span>
            </div>
            <input
              className="settings-date-input"
              type="date"
              value={examDate}
              onChange={(event) => updateExamDate(event.target.value)}
              aria-label="Theory test date"
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>Appearance</strong>
              <span>Choose light or dark mode for this device.</span>
            </div>
            <div className="settings-segmented settings-theme-choice" role="group" aria-label="Appearance">
              <button type="button" className={theme === "light" ? "settings-choice settings-choice-active" : "settings-choice"} onClick={() => updateTheme("light")}>Light</button>
              <button type="button" className={theme === "dark" ? "settings-choice settings-choice-active" : "settings-choice"} onClick={() => updateTheme("dark")}>Dark</button>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">Account</p>
              <h2>{displayName}</h2>
            </div>
          </div>

          <div className="settings-account-detail">
            <span>Email address</span>
            <strong>{user.email ?? "Not available"}</strong>
          </div>

          <button className="button button-secondary" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </section>

        <section className="settings-card settings-danger-card" aria-labelledby="danger-title">
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow settings-danger-eyebrow">Danger zone</p>
              <h2 id="danger-title">Delete your account</h2>
            </div>
          </div>

          <p>Permanently delete your TheoryPrep account and the progress, mock-test history, bookmarks and preferences linked to it.</p>

          {!deleteOpen ? (
            <button className="settings-delete-button" type="button" onClick={() => setDeleteOpen(true)}>
              <span className="settings-bin-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 7.5h14M9 7.5V5h6v2.5M7.5 7.5l.8 12h7.4l.8-12M10 11v5M14 11v5" />
                </svg>
              </span>
              Delete account
            </button>
          ) : (
            <div className="settings-delete-confirm">
              <strong>This cannot be undone.</strong>
              <span>Type DELETE below to permanently remove your account and all associated data.</span>
              <input
                type="text"
                value={deleteText}
                onChange={(event) => setDeleteText(event.target.value.replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase())}
                placeholder="DELETE"
                autoComplete="off"
                aria-label="Type DELETE to confirm account deletion"
              />
              <div className="settings-delete-actions">
                <button className="button button-secondary" type="button" onClick={() => { setDeleteOpen(false); setDeleteText(""); }}>
                  Cancel
                </button>
                <button className="settings-delete-confirm-button" type="button" disabled={deleteText !== "DELETE" || deleting} onClick={() => void deleteAccount()}>
                  {deleting ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </div>
          )}
        </section>

        {message && <p className="settings-message" role="status">{message}</p>}
      </div>
    </main>
  );
}
