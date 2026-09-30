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
    const response = await fetch("/api/app/preferences", { cache: "no-store" });
    if (!response.ok) return defaults;
    const data = await response.json();
    return { ...defaults, ...data.preferences };
  } catch {
    return defaults;
  }
}

export async function saveAppPreferences(
  patch: Partial<Pick<AppPreferences, "daily_goal" | "reminders_enabled" | "streak_guard_enabled" | "reminder_timezone">>,
) {
  try {
    const response = await fetch("/api/app/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.preferences as AppPreferences;
  } catch {
    return null;
  }
}
