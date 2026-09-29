"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgressData } from "@/lib/progress";
import { buildLearningPlan } from "@/lib/learning";
import { getAppPreferences, saveAppPreferences, type AppPreferences } from "@/lib/app-preferences";
import { questions } from "@/lib/questions";

function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function MobileAppTools() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [notificationState, setNotificationState] = useState<"unknown" | "on" | "off" | "unavailable">("unknown");
  const [busy, setBusy] = useState<"notification" | "offline" | "test" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([getAppPreferences(), getProgressData(2000)]).then(([prefs, progress]) => {
      if (!mounted) return;
      setPreferences(prefs);
      setData(progress);
    });

    try {
      setOfflineReady(localStorage.getItem("theoryprep-offline-ready") === "1");
    } catch {
      setOfflineReady(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationState("unavailable");
      return;
    }

    if (Notification.permission === "granted") setNotificationState("on");
    else if (Notification.permission === "denied") setNotificationState("off");
    else setNotificationState("unknown");
  }, []);

  const todayStats = useMemo(() => {
    const today = localDateKey(new Date());
    const attempts = (data?.attempts ?? []).filter(
      (attempt) => attempt.selected_answer !== null && localDateKey(attempt.created_at) === today,
    );

    return {
      answered: attempts.length,
      correct: attempts.filter((attempt) => attempt.is_correct).length,
    };
  }, [data?.attempts]);

  const smartCount = useMemo(() => {
    if (!data) return 0;
    return buildLearningPlan(questions, data.attempts, 10).filter((item) => item.kind === "focus").length;
  }, [data]);

  async function enableNotifications() {
    setBusy("notification");
    setMessage("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setNotificationState("unavailable");
        setMessage("Notifications aren't supported on this device.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage("Push is prepared, but the public VAPID key still needs to be added to Vercel.");
        return;
      }

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      if (permission !== "granted") {
        setNotificationState("off");
        setMessage("Notifications stayed off. You can enable them later in your device settings.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) throw new Error("Could not save notification subscription.");

      const next = await saveAppPreferences({ reminders_enabled: true });
      if (next) setPreferences(next);
      setNotificationState("on");
      setMessage("Reminders are on. TheoryPrep will keep them gentle.");
    } catch (error) {
      console.warn(error);
      setMessage("Couldn't turn notifications on yet. Check your permissions and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function disableNotifications() {
    setBusy("notification");
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      const next = await saveAppPreferences({ reminders_enabled: false });
      if (next) setPreferences(next);
      setNotificationState("off");
      setMessage("Daily reminders are off.");
    } finally {
      setBusy(null);
    }
  }

  async function testNotification() {
    setBusy("test");
    setMessage("");

    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(typeof body.error === "string" ? body.error : "The notification test could not be sent.");
        return;
      }

      setMessage(body.sent ? "Test notification sent." : "No active notification subscription was found.");
    } catch {
      setMessage("The notification test could not be reached.");
    } finally {
      setBusy(null);
    }
  }

  async function setGoal(value: number) {
    const next = await saveAppPreferences({ daily_goal: value });
    if (next) setPreferences(next);
  }

  async function setStreakGuard(enabled: boolean) {
    const next = await saveAppPreferences({ streak_guard_enabled: enabled });
    if (next) setPreferences(next);
  }

  async function makeOfflineReady() {
    setBusy("offline");
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: "PRECACHE_APP" });

      try {
        localStorage.setItem("theoryprep-offline-ready", "1");
      } catch {
        // Offline mode still works without the status marker.
      }

      setOfflineReady(true);
      setMessage("Offline mode is prepared. Open Offline Practice once now while connected.");
    } catch {
      setMessage("Couldn't prepare offline mode yet. Reload with a connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1024px)").matches &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  if (!isMobile || !data?.user || !preferences) return null;

  const goal = preferences.daily_goal;
  const goalProgress = Math.min(goal, todayStats.answered);
  const notificationOn = notificationState === "on";

  return (
    <section className="mobile-app-tools" aria-labelledby="mobile-app-tools-title">
      <div className="mobile-app-tools-heading">
        <div>
          <p className="eyebrow">Your app</p>
          <h2 id="mobile-app-tools-title">Small settings, useful every day.</h2>
        </div>
        <span className="mobile-app-tools-badge">MOBILE</span>
      </div>

      {todayStats.answered === 0 && (
        <div className="mobile-app-nudge">
          <span aria-hidden="true">○</span>
          <div>
            <strong>You haven't practised today.</strong>
            <small>{goal} questions is your current daily target.</small>
          </div>
          <Link href="/practice/learn">Start <span aria-hidden="true">→</span></Link>
        </div>
      )}

      <div className="mobile-app-tool-list">
        <div className="mobile-app-tool-row">
          <div className="mobile-app-tool-icon" aria-hidden="true">↗</div>
          <div>
            <strong>Offline practice</strong>
            <small>{offlineReady ? "Ready for a no-signal quick set." : "Prepare the app for practice without a connection."}</small>
          </div>
          <button className="mobile-app-tool-action" type="button" onClick={makeOfflineReady} disabled={busy === "offline"}>
            {offlineReady ? "Ready" : busy === "offline" ? "Saving…" : "Prepare"}
          </button>
        </div>

        <div className="mobile-app-tool-row">
          <div className="mobile-app-tool-icon" aria-hidden="true">⌁</div>
          <div>
            <strong>Daily reminders</strong>
            <small>{notificationOn ? "One gentle evening reminder when you haven't practised." : "Get a small nudge when your day is still empty."}</small>
          </div>
          <div className="mobile-app-action-pair">
            <button className={notificationOn ? "mobile-app-tool-action mobile-app-tool-action-active" : "mobile-app-tool-action"} type="button" onClick={notificationOn ? disableNotifications : enableNotifications} disabled={busy === "notification" || notificationState === "unavailable"}>
              {busy === "notification" ? "…" : notificationOn ? "On" : "Enable"}
            </button>
            {notificationOn && <button className="mobile-app-test-action" type="button" onClick={testNotification} disabled={busy === "test"}>{busy === "test" ? "…" : "Test"}</button>}
          </div>
        </div>

        <div className="mobile-app-tool-row mobile-app-goal-row">
          <div className="mobile-app-tool-icon" aria-hidden="true">✓</div>
          <div>
            <strong>Daily goal</strong>
            <small>{goalProgress}/{goal} questions today</small>
          </div>
          <select aria-label="Daily question goal" value={goal} onChange={(event) => void setGoal(Number(event.target.value))}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </div>

        <div className="mobile-app-tool-row">
          <div className="mobile-app-tool-icon" aria-hidden="true">◌</div>
          <div>
            <strong>Streak protection</strong>
            <small>{preferences.streak_guard_enabled ? "Use your evening reminder to protect a run from going quiet." : "The streak guard is currently off."}</small>
          </div>
          <button className={preferences.streak_guard_enabled ? "mobile-app-tool-action mobile-app-tool-action-active" : "mobile-app-tool-action"} type="button" onClick={() => void setStreakGuard(!preferences.streak_guard_enabled)}>
            {preferences.streak_guard_enabled ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="mobile-app-smart-row">
        <div>
          <p className="eyebrow">Smart revision</p>
          <strong>{smartCount ? smartCount + " focus question" + (smartCount === 1 ? " is" : "s are") + " waiting." : "Your smart review is clear."}</strong>
          <small>The learning engine uses your answer history to decide what deserves another look.</small>
        </div>
        <Link className="button button-secondary" href="/practice/learn">Review <span aria-hidden="true">→</span></Link>
      </div>

      {message && <p className="mobile-app-tools-message" role="status">{message}</p>}
    </section>
  );
}
