import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
const MAX_SHIELDS = 3;

function localDateKey(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Dublin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

function getYesterdayKey(timezone: string) {
  return localDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000), timezone);
}

async function getSessionClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function ensurePreferences(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { error } = await supabase
    .from("user_app_preferences")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (error) throw error;
}

async function reconcile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { error } = await supabase.rpc("reconcile_streak_protection", { target_user: userId });
  if (error) throw error;
}

async function loadState(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  await ensurePreferences(supabase, userId);
  await reconcile(supabase, userId);

  const { data: preferences, error } = await supabase
    .from("user_app_preferences")
    .select(
      "streak_shields, streak_protection_active, streak_protection_activated_at, reminders_enabled, streak_guard_enabled, reminder_timezone",
    )
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  const { data: protectedDays, error: protectedDaysError } = await supabase
    .from("streak_protected_days")
    .select("protected_date")
    .eq("user_id", userId)
    .order("protected_date", { ascending: false })
    .limit(100);

  if (protectedDaysError) throw protectedDaysError;

  return {
    streak_shields: Math.min(MAX_SHIELDS, Number(preferences.streak_shields ?? 0)),
    streak_protection_active: Boolean(preferences.streak_protection_active),
    streak_protection_activated_at: preferences.streak_protection_activated_at ?? null,
    reminders_enabled: Boolean(preferences.reminders_enabled),
    streak_guard_enabled: Boolean(preferences.streak_guard_enabled),
    reminder_timezone: preferences.reminder_timezone || "Europe/Dublin",
    protected_dates: (protectedDays ?? []).map((row) => String(row.protected_date)),
  };
}

export async function GET(request: Request) {
  const rate = rateLimit(request, { scope: "streak-protection-read", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);
  const { supabase, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    return NextResponse.json({ protection: await loadState(supabase, user.id) });
  } catch (error) {
    console.error("Could not load streak protection:", error);
    return NextResponse.json({ error: "Could not load streak protection." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "streak-protection-write", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);
  const { supabase, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const state = await loadState(supabase, user.id);
    if (state.streak_protection_active) {
      return NextResponse.json({ protection: state });
    }

    if (state.streak_shields < 1) {
      return NextResponse.json(
        { error: "You do not have a streak protection available yet.", protection: state },
        { status: 400 },
      );
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("question_attempts")
      .select("created_at, selected_answer")
      .eq("user_id", user.id)
      .not("selected_answer", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (attemptsError) throw attemptsError;

    const timezone = state.reminder_timezone || "Europe/Dublin";
    const today = localDateKey(new Date(), timezone);
    const yesterday = getYesterdayKey(timezone);
    const days = new Set((attempts ?? []).map((attempt) => localDateKey(new Date(attempt.created_at), timezone)));

    if (!days.has(today) && !days.has(yesterday)) {
      return NextResponse.json(
        { error: "Start a practice streak before activating protection.", protection: state },
        { status: 400 },
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_app_preferences")
      .update({
        streak_shields: Math.max(0, state.streak_shields - 1),
        streak_protection_active: true,
        streak_protection_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("streak_protection_active", false)
      .gt("streak_shields", 0)
      .select(
        "streak_shields, streak_protection_active, streak_protection_activated_at, reminders_enabled, streak_guard_enabled, reminder_timezone",
      )
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) {
      return NextResponse.json(
        { error: "Your streak protection changed before it could be activated. Please try again." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      protection: {
        ...updated,
        streak_shields: Number(updated.streak_shields ?? 0),
        protected_dates: state.protected_dates,
      },
    });
  } catch (error) {
    console.error("Could not activate streak protection:", error);
    return NextResponse.json({ error: "Could not activate streak protection." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rate = rateLimit(request, { scope: "streak-protection-write", limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);
  const { supabase, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    await ensurePreferences(supabase, user.id);

    const current = await loadState(supabase, user.id);
    const { data: updated, error } = await supabase
      .from("user_app_preferences")
      .update({
        streak_shields: Math.min(MAX_SHIELDS, current.streak_shields + 1),
        streak_protection_active: false,
        streak_protection_activated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("streak_protection_active", true)
      .select(
        "streak_shields, streak_protection_active, streak_protection_activated_at, reminders_enabled, streak_guard_enabled, reminder_timezone",
      )
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ protection: await loadState(supabase, user.id) });
    }

    const state = await loadState(supabase, user.id);
    return NextResponse.json({ protection: state });
  } catch (error) {
    console.error("Could not deactivate streak protection:", error);
    return NextResponse.json({ error: "Could not deactivate streak protection." }, { status: 500 });
  }
}
