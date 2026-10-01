export const MAX_DISPLAY_NAME_LENGTH = 40;

const DISALLOWED_DISPLAY_NAME_CHARS =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/gu;

export function sanitizeDisplayName(value: string) {
  return value
    .replace(DISALLOWED_DISPLAY_NAME_CHARS, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function getDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? sanitizeDisplayName(user.user_metadata.full_name)
      : typeof user.user_metadata?.name === "string"
        ? sanitizeDisplayName(user.user_metadata.name)
        : "";

  if (metadataName) {
    return Array.from(metadataName).slice(0, MAX_DISPLAY_NAME_LENGTH).join("");
  }

  const emailName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!emailName) return "Account";

  const fallback = sanitizeDisplayName(emailName);
  return Array.from(fallback).slice(0, MAX_DISPLAY_NAME_LENGTH).join("")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Account";
}
