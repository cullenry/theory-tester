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

export async function recordQuestionAttempt(question: Question, selectedAnswer: string | null, isCorrect: boolean, mode: AttemptMode) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;
  const { error } = await supabase.from("question_attempts").insert({
    user_id: user.user.id, question_id: question.id, is_correct: isCorrect, selected_answer: selectedAnswer, mode,
  });
  if (error) console.warn("Could not save question attempt:", error.message);
}

export async function recordMockTest(result: { formatId: string; questionCount: number; correctCount: number; answeredCount: number; percentage: number; timeExpired: boolean; }) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  let sourceId: string | null = null;

  if (user.user) {
    const { data, error } = await supabase.from("mock_tests").insert({
      user_id: user.user.id, format_id: result.formatId, question_count: result.questionCount, correct_count: result.correctCount, answered_count: result.answeredCount,
      percentage: result.percentage, time_expired: result.timeExpired,
    }).select("id").single();

    if (error) {
      console.warn("Could not save mock test:", error.message);
    } else {
      sourceId = data?.id ?? null;
    }
  }

  const { error: completionError } = await supabase.from("test_completions").insert({
    user_id: user.user?.id ?? null,
    test_type: "mock",
    source_id: sourceId,
  });

  if (completionError) {
    console.warn("Could not record test completion:", completionError.message);
  }
}

export async function getTestCompletionCount(): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_test_completion_count");

  if (error) {
    console.warn("Could not load test completion count:", error.message);
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

export async function getMistakeQuestionIds(limit = 80) {
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
