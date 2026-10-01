import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const DEFAULTS = {
  daily_goal: 20,
  reminders_enabled: false,
  streak_guard_enabled: true,
  reminder_timezone: "Europe/Dublin",
  streak_shields: 0,
  streak_protection_active: false,
  streak_protection_activated_at: null,
};

export const runtime = "nodejs";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function loadPreferences(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_app_preferences")
    .select("daily_goal, reminders_enabled, streak_guard_enabled, reminder_timezone, last_reminder_sent_on, streak_shields, streak_protection_active, streak_protection_activated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? { ...DEFAULTS, last_reminder_sent_on: null };
}

export async function GET(request: Request) {
  const rate = rateLimit(request, { scope: "app-preferences-read", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    return NextResponse.json({ preferences: await loadPreferences(user.id) });
  } catch (error) {
    console.error("Could not load app preferences:", error);
    return NextResponse.json({ preferences: { ...DEFAULTS, last_reminder_sent_on: null } });
  }
}

export async function PUT(request: Request) {
  const rate = rateLimit(request, { scope: "app-preferences-write", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8 * 1024) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = rawBody as Record<string, unknown>;
  const existing = await loadPreferences(user.id);
  const dailyGoal = body.daily_goal === undefined ? existing.daily_goal : Number(body.daily_goal);
  const remindersEnabled = body.reminders_enabled === undefined
    ? existing.reminders_enabled
    : typeof body.reminders_enabled === "boolean"
      ? body.reminders_enabled
      : existing.reminders_enabled;
  const streakGuardEnabled = body.streak_guard_enabled === undefined
    ? existing.streak_guard_enabled
    : typeof body.streak_guard_enabled === "boolean"
      ? body.streak_guard_enabled
      : existing.streak_guard_enabled;
  const timezone = typeof body.reminder_timezone === "string" &&
    body.reminder_timezone.length > 0 &&
    body.reminder_timezone.length < 80
      ? body.reminder_timezone
      : existing.reminder_timezone;

  if (![10, 20, 30].includes(dailyGoal)) {
    return NextResponse.json({ error: "Invalid daily goal." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_app_preferences")
    .upsert({
      user_id: user.id,
      daily_goal: dailyGoal,
      reminders_enabled: remindersEnabled,
      streak_guard_enabled: streakGuardEnabled,
      reminder_timezone: timezone,
    }, { onConflict: "user_id" })
    .select("daily_goal, reminders_enabled, streak_guard_enabled, reminder_timezone, last_reminder_sent_on, streak_shields, streak_protection_active, streak_protection_activated_at")
    .single();

  if (error) {
    console.error("Could not save app preferences:", error);
    return NextResponse.json({ error: "Could not save app preferences." }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
