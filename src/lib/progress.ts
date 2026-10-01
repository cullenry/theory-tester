import { createClient } from "@/lib/supabase/client";
import type { Question } from "@/lib/questions";

export type AttemptMode = "practice" | "mock" | "daily" | "smart";

export type QuestionAttempt = {
  id: string;
  question_id: number;
  is_correct: boolean;
  selected_answer: string | null;
  mode: AttemptMode;
  created_at: string;
};

export type MockTestResult = {
  id: string;
  format_id: string;
  question_count: number;
  correct_count: number;
  answered_count: number;
  percentage: number;
  time_expired: boolean;
  created_at: string;
};

type OfflineAttempt = {
  question_id: number;
  is_correct: boolean;
  selected_answer: string | null;
  mode: AttemptMode;
  created_at: string;
  client_event_id?: string;
};

const OFFLINE_QUEUE_KEY_PREFIX = "theoryprep-offline-attempts-";

function offlineQueueKey(userId: string) {
  return OFFLINE_QUEUE_KEY_PREFIX + userId;
}

function readOfflineQueue(userId: string) {
  try {
    const raw = localStorage.getItem(offlineQueueKey(userId));
    if (!raw) return [] as OfflineAttempt[];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is OfflineAttempt =>
        Boolean(item && typeof item === "object" &&
          Number.isInteger((item as OfflineAttempt).question_id) &&
          (item as OfflineAttempt).question_id > 0 &&
          typeof (item as OfflineAttempt).is_correct === "boolean" &&
          typeof (item as OfflineAttempt).mode === "string" &&
          ["practice", "mock", "daily", "smart"].includes((item as OfflineAttempt).mode) &&
          typeof (item as OfflineAttempt).created_at === "string")
      )
      .map((item) => ({
        ...item,
        client_event_id:
          typeof item.client_event_id === "string" && item.client_event_id.length <= 100
            ? item.client_event_id
            : createClientEventId(),
      }));

  } catch {
    return [] as OfflineAttempt[];
  }
}

function createClientEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function writeOfflineQueue(userId: string, queue: OfflineAttempt[]) {
  try {
    if (!queue.length) localStorage.removeItem(offlineQueueKey(userId));
    else localStorage.setItem(offlineQueueKey(userId), JSON.stringify(queue.slice(-200)));
  } catch {
    // Offline persistence is an enhancement.
  }
}

function queueOfflineAttempt(userId: string, attempt: OfflineAttempt) {
  writeOfflineQueue(userId, [
    ...readOfflineQueue(userId),
    { ...attempt, client_event_id: attempt.client_event_id ?? createClientEventId() },
  ]);
}

let bookmarkCache: Set<number> | null = null;
let bookmarkCacheUserId: string | null = null;
let bookmarkCachePromise: Promise<Set<number>> | null = null;

async function loadBookmarkCache(): Promise<Set<number>> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    bookmarkCache = new Set<number>();
    bookmarkCacheUserId = null;
    bookmarkCachePromise = null;
    return bookmarkCache;
  }

  if (bookmarkCache && bookmarkCacheUserId === user.user.id) return bookmarkCache;
  if (bookmarkCachePromise && bookmarkCacheUserId === user.user.id) return bookmarkCachePromise;

  bookmarkCacheUserId = user.user.id;
  bookmarkCachePromise = (async () => {
    const { data, error } = await supabase
      .from("question_bookmarks")
      .select("question_id")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });

    const nextCache = error
      ? new Set<number>()
      : new Set<number>((data ?? []).map((row) => row.question_id));

    if (error) {
      console.warn("Could not load starred questions:", error.message);
    }

    bookmarkCache = nextCache;
    return nextCache;
  })();

  try {
    return await bookmarkCachePromise;
  } finally {
    bookmarkCachePromise = null;
  }
}

export async function getStarredQuestionIds() {
  return [...(await loadBookmarkCache())];
}

export async function toggleQuestionBookmark(questionId: number) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return { signedIn: false, starred: false, available: false };
  }

  const cache = await loadBookmarkCache();
  const currentlyStarred = cache.has(questionId);

  if (currentlyStarred) {
    const { error } = await supabase
      .from("question_bookmarks")
      .delete()
      .eq("user_id", user.user.id)
      .eq("question_id", questionId);

    if (error) {
      console.warn("Could not unstar question:", error.message);
      return { signedIn: true, starred: true, available: !error.message.toLowerCase().includes("does not exist") };
    }

    cache.delete(questionId);
    return { signedIn: true, starred: false, available: true };
  }

  const { error } = await supabase
    .from("question_bookmarks")
    .insert({ user_id: user.user.id, question_id: questionId });

  if (error) {
    console.warn("Could not star question:", error.message);
    return { signedIn: true, starred: false, available: !error.message.toLowerCase().includes("does not exist") };
  }

  cache.add(questionId);
  return { signedIn: true, starred: true, available: true };
}

export async function flushOfflineAttempts() {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return 0;

  const queue = readOfflineQueue(user.id);
  if (!queue.length) return 0;

  const { error } = await supabase.from("question_attempts").upsert(
    queue.map((attempt) => ({
      user_id: user.id,
      question_id: attempt.question_id,
      is_correct: attempt.is_correct,
      selected_answer: attempt.selected_answer,
      mode: attempt.mode,
      created_at: attempt.created_at,
      client_event_id: attempt.client_event_id ?? createClientEventId(),
    })),
    { onConflict: "client_event_id", ignoreDuplicates: true },
  );

  if (error) {
    console.warn("Could not sync offline attempts:", error.message);
    return 0;
  }

  writeOfflineQueue(user.id, []);
  return queue.length;
}

export async function recordQuestionAttempt(question: Question, selectedAnswer: string | null, isCorrect: boolean, mode: AttemptMode) {
  const createdAt = new Date().toISOString();
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) return;

  const clientEventId = createClientEventId();
  const attempt = {
    user_id: user.id,
    question_id: question.id,
    is_correct: isCorrect,
    selected_answer: selectedAnswer,
    mode,
    created_at: createdAt,
    client_event_id: clientEventId,
  };

  if (typeof window !== "undefined" && !navigator.onLine) {
    queueOfflineAttempt(user.id, {
      question_id: question.id,
      is_correct: isCorrect,
      selected_answer: selectedAnswer,
      mode,
      created_at: createdAt,
      client_event_id: clientEventId,
    });
    return;
  }

  const { error } = await supabase.from("question_attempts").insert(attempt);
  if (error) {
    console.warn("Could not save question attempt:", error.message);
    queueOfflineAttempt(user.id, {
      question_id: question.id,
      is_correct: isCorrect,
      selected_answer: selectedAnswer,
      mode,
      created_at: createdAt,
      client_event_id: clientEventId,
    });
    return;
  }

  void flushOfflineAttempts();
}

export async function recordMockTest(result: {
  formatId: string;
  questionCount: number;
  correctCount: number;
  answeredCount: number;
  percentage: number;
  timeExpired: boolean;
  questionIds: number[];
  responses: (string | null)[];
}) {
  try {
    const response = await fetch("/api/mock-test/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formatId: result.formatId,
        questionIds: result.questionIds,
        responses: result.responses,
        timeExpired: result.timeExpired,
      }),
    });

    if (!response.ok) {
      console.warn("Server rejected mock test completion:", await response.text());
    }
  } catch (error) {
    console.warn("Could not verify mock test completion:", error);
  }
}

export async function getTestCompletionCount(): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_mock_test_count");

  if (error) {
    console.warn("Could not load global mock test count:", error.message);
    return null;
  }

  const count = Number(data);
  return Number.isFinite(count) ? count : null;
}

export async function getProgressData(limit = 2000) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return {
      user: null,
      attempts: [] as QuestionAttempt[],
      mockTests: [] as MockTestResult[],
      starredQuestionIds: [] as number[],
      available: false,
      bookmarksAvailable: false,
    };
  }

  const [attemptsResult, mocksResult, bookmarksResult] = await Promise.all([
    supabase.from("question_attempts").select("id, question_id, is_correct, selected_answer, mode, created_at").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(limit),
    supabase.from("mock_tests").select("id, format_id, question_count, correct_count, answered_count, percentage, time_expired, created_at").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("question_bookmarks").select("question_id").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(500),
  ]);

  const missing = [attemptsResult.error, mocksResult.error].some((error) =>
    error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist")
  );
  const bookmarksMissing =
    bookmarksResult.error?.code === "42P01" ||
    bookmarksResult.error?.message?.toLowerCase().includes("does not exist");

  return {
    user: user.user,
    attempts: (attemptsResult.data ?? []) as QuestionAttempt[],
    mockTests: (mocksResult.data ?? []) as MockTestResult[],
    starredQuestionIds: bookmarksMissing ? [] : (bookmarksResult.data ?? []).map((row) => row.question_id),
    available: !missing && !attemptsResult.error && !mocksResult.error,
    bookmarksAvailable: !bookmarksMissing && !bookmarksResult.error,
  };
}

export async function getMistakeQuestionIds(limit = 2000) {
  const data = await getProgressData(2000);
  const ids = new Set<number>();
  for (const attempt of data.attempts) {
    if (!attempt.is_correct && attempt.selected_answer !== null) {
      ids.add(attempt.question_id);
      if (ids.size >= limit) break;
    }
  }
  return [...ids];
}
