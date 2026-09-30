import { createClient } from "@/lib/supabase/client";

export type AppPreferences = {
  daily_goal: number;
  reminders_enabled: boolean;
  streak_guard_enabled: boolean;
  reminder_timezone: string;
  last_reminder_sent_on: string | null;
  streak_shields: number;
  streak_protection_active: boolean;
  streak_protection_activated_at: string | null;
};

const defaults: AppPreferences = {
  daily_goal: 20,
  reminders_enabled: false,
  streak_guard_enabled: true,
  reminder_timezone: "Europe/Dublin",
  last_reminder_sent_on: null,
  streak_shields: 0,
  streak_protection_active: false,
  streak_protection_activated_at: null,
};

export async function getAppPreferences(): Promise<AppPreferences> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaults;

    const { data, error } = await supabase
      .from("user_app_preferences")
      .select(
        "daily_goal, reminders_enabled, streak_guard_enabled, reminder_timezone, last_reminder_sent_on, streak_shields, streak_protection_active, streak_protection_activated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Could not load app preferences:", error.message);
      return defaults;
    }

    return { ...defaults, ...(data ?? {}) };
  } catch (error) {
    console.warn("Could not load app preferences:", error);
    return defaults;
  }
}

export async function saveAppPreferences(
  patch: Partial<Pick<
    AppPreferences,
    "daily_goal" | "reminders_enabled" | "streak_guard_enabled" | "reminder_timezone"
  >>,
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_app_preferences")
      .upsert(
        {
          user_id: user.id,
          ...patch,
        },
        { onConflict: "user_id" },
      )
      .select(
        "daily_goal, reminders_enabled, streak_guard_enabled, reminder_timezone, last_reminder_sent_on, streak_shields, streak_protection_active, streak_protection_activated_at",
      )
      .single();

    if (error) {
      console.warn("Could not save app preferences:", error.message);
      return null;
    }

    return { ...defaults, ...data } as AppPreferences;
  } catch (error) {
    console.warn("Could not save app preferences:", error);
    return null;
  }
}
