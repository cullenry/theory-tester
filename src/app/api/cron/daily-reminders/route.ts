import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pushConfigured, sendTheoryPrepPush } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function localDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localHour(date: Date, timezone: string) {
  return Number(new Intl.DateTimeFormat("en-IE", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).format(date));
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!pushConfigured) return NextResponse.json({ error: "Push is not configured." }, { status: 503 });

  const { data: preferences, error: preferencesError } = await supabaseAdmin
    .from("user_app_preferences")
    .select("user_id, daily_goal, reminders_enabled, streak_guard_enabled, streak_shields, streak_protection_active, reminder_timezone, last_reminder_sent_on")
    .eq("reminders_enabled", true);

  if (preferencesError) return NextResponse.json({ error: "Could not load preferences." }, { status: 500 });

  const userIds = (preferences ?? []).map((preference) => preference.user_id);
  if (!userIds.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subscriptionsError) return NextResponse.json({ error: "Could not load subscriptions." }, { status: 500 });

  const recentSince = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: attempts } = await supabaseAdmin
    .from("question_attempts")
    .select("user_id, created_at")
    .in("user_id", userIds)
    .gte("created_at", recentSince);

  const subscriptionsByUser = new Map<string, typeof subscriptions>();
  for (const subscription of subscriptions ?? []) {
    const list = subscriptionsByUser.get(subscription.user_id) ?? [];
    list.push(subscription);
    subscriptionsByUser.set(subscription.user_id, list);
  }

  const attemptsByUser = new Map<string, typeof attempts>();
  for (const attempt of attempts ?? []) {
    const list = attemptsByUser.get(attempt.user_id) ?? [];
    list.push(attempt);
    attemptsByUser.set(attempt.user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  const now = new Date();

  for (const preference of preferences ?? []) {
    try {
      const timezone = preference.reminder_timezone || "Europe/Dublin";
      const today = localDateKey(now, timezone);
      const yesterday = localDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000), timezone);

      // Hobby cron is daily, so the reminder is intentionally delivered in the evening window.
      const hour = localHour(now, timezone);
      if (hour < 18 || hour > 20 || preference.last_reminder_sent_on === today) {
        skipped += 1;
        continue;
      }

      const userAttempts = attemptsByUser.get(preference.user_id) ?? [];
      const practicedToday = userAttempts.some(
        (attempt) => localDateKey(new Date(attempt.created_at), timezone) === today,
      );
      if (practicedToday) {
        skipped += 1;
        continue;
      }

      const practicedYesterday = userAttempts.some(
        (attempt) => localDateKey(new Date(attempt.created_at), timezone) === yesterday,
      );

      const atRisk = preference.streak_guard_enabled && practicedYesterday;
      const hasUnusedProtection = Number(preference.streak_shields ?? 0) > 0;
      const hasActiveProtection = Boolean(preference.streak_protection_active);

      const title = atRisk && hasActiveProtection
        ? "Your TheoryPrep protection is active"
        : atRisk && hasUnusedProtection
          ? "Protect your TheoryPrep streak"
          : "A little TheoryPrep for today";
      const body = atRisk && hasActiveProtection
        ? "Your next missed day is covered. No action needed — a quick set today keeps the run moving."
        : atRisk && hasUnusedProtection
          ? "Your streak is at risk. You have a protection ready — activate it before your day ends."
          : "You're aiming for " + preference.daily_goal + " questions today. Ten minutes is enough to keep moving.";

      for (const subscription of subscriptionsByUser.get(preference.user_id) ?? []) {
        try {
          await sendTheoryPrepPush(subscription, {
            title,
            body,
            url: atRisk ? "/" : "/practice/learn",
            tag: atRisk && hasUnusedProtection ? "theoryprep-streak-protection" : atRisk ? "theoryprep-streak" : "theoryprep-daily",
          });
          sent += 1;
        } catch (pushError) {
          const statusCode = (pushError as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
          }
        }
      }

      await supabaseAdmin
        .from("user_app_preferences")
        .update({ last_reminder_sent_on: today })
        .eq("user_id", preference.user_id);
    } catch {
      skipped += 1;
    }
  }

  return NextResponse.json({ sent, skipped });
}