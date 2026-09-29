export type FriendChallengePayload = {
  version: 1;
  name: string;
  score: number;
  total: number;
  questionIds: number[];
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeFriendChallenge(payload: FriendChallengePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeFriendChallenge(value: string): FriendChallengePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as Partial<FriendChallengePayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.name !== "string" ||
      typeof parsed.score !== "number" ||
      typeof parsed.total !== "number" ||
      !Array.isArray(parsed.questionIds) ||
      parsed.total !== 10 ||
      parsed.questionIds.length !== 10 ||
      parsed.questionIds.some((id) => !Number.isInteger(id) || id <= 0) ||
      !Number.isInteger(parsed.score) ||
      parsed.score < 0 ||
      parsed.score > parsed.total
    ) {
      return null;
    }

    return {
      version: 1,
      name: parsed.name.trim().slice(0, 40) || "A TheoryPrep driver",
      score: parsed.score,
      total: parsed.total,
      questionIds: parsed.questionIds,
    };
  } catch {
    return null;
  }
}

export function buildFriendChallengeUrl(payload: FriendChallengePayload): string {
  if (typeof window === "undefined") return "";
  return new URL(`/challenge/${encodeFriendChallenge(payload)}`, window.location.origin).toString();
}

export async function shareText(options: {
  title: string;
  text: string;
  url: string;
}): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return "shared";
    }

    await navigator.clipboard.writeText(options.text + " " + options.url);
    return "copied";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "failed";

    try {
      await navigator.clipboard.writeText(options.text + " " + options.url);
      return "copied";
    } catch {
      return "failed";
    }
  }
}
