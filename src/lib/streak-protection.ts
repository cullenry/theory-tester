export type StreakProtectionState = {
  streak_shields: number;
  streak_protection_active: boolean;
  streak_protection_activated_at: string | null;
  reminders_enabled: boolean;
  streak_guard_enabled: boolean;
  reminder_timezone: string;
  protected_dates: string[];
};

export async function getStreakProtection(): Promise<StreakProtectionState | null> {
  try {
    const response = await fetch("/api/streak-protection", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.protection as StreakProtectionState;
  } catch {
    return null;
  }
}

export async function activateStreakProtection(): Promise<StreakProtectionState | null> {
  try {
    const response = await fetch("/api/streak-protection", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return data.protection as StreakProtectionState;
  } catch {
    return null;
  }
}

export async function deactivateStreakProtection(): Promise<StreakProtectionState | null> {
  try {
    const response = await fetch("/api/streak-protection", { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return data.protection as StreakProtectionState;
  } catch {
    return null;
  }
}
