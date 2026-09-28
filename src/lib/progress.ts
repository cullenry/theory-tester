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
  if (!user.user) return;
  const { error } = await supabase.from("mock_tests").insert({
    user_id: user.user.id, format_id: result.formatId, question_count: result.questionCount, correct_count: result.correctCount,
    answered_count: result.answeredCount, percentage: result.percentage, time_expired: result.timeExpired,
  });
  if (error) console.warn("Could not save mock test:", error.message);
}

export async function getProgressData(limit = 2000) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { user: null, attempts: [] as QuestionAttempt[], mockTests: [] as MockTestResult[], available: false };

  const [attemptsResult, mocksResult] = await Promise.all([
    supabase.from("question_attempts").select("id, question_id, is_correct, selected_answer, mode, created_at").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(limit),
    supabase.from("mock_tests").select("id, format_id, question_count, correct_count, answered_count, percentage, time_expired, created_at").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const missing = [attemptsResult.error, mocksResult.error].some((error) => error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist"));
  return {
    user: user.user,
    attempts: (attemptsResult.data ?? []) as QuestionAttempt[],
    mockTests: (mocksResult.data ?? []) as MockTestResult[],
    available: !missing && !attemptsResult.error && !mocksResult.error,
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
