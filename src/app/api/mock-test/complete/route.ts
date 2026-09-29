import { NextResponse } from "next/server";
import { getQuestionById } from "@/lib/questions";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TEST_FORMATS = {
  full: { questionCount: 40 },
  "blitz-20": { questionCount: 20 },
  "blitz-10": { questionCount: 10 },
} as const;

type FormatId = keyof typeof TEST_FORMATS;

type CompletionPayload = {
  formatId?: unknown;
  questionIds?: unknown;
  responses?: unknown;
  timeExpired?: unknown;
};

export async function POST(request: Request) {
  let body: CompletionPayload;

  try {
    body = (await request.json()) as CompletionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const formatId = body.formatId;
  const questionIds = body.questionIds;
  const responses = body.responses;
  const timeExpired = body.timeExpired;

  if (
    typeof formatId !== "string" ||
    !Object.prototype.hasOwnProperty.call(TEST_FORMATS, formatId) ||
    !Array.isArray(questionIds) ||
    !Array.isArray(responses) ||
    questionIds.length !== responses.length
  ) {
    return NextResponse.json({ error: "Invalid mock test payload." }, { status: 400 });
  }

  const expectedCount = TEST_FORMATS[formatId as FormatId].questionCount;

  if (
    questionIds.length !== expectedCount ||
    !questionIds.every((id) => Number.isInteger(id) && id > 0) ||
    new Set(questionIds).size !== questionIds.length
  ) {
    return NextResponse.json({ error: "Invalid question set." }, { status: 400 });
  }

  let correctCount = 0;
  let answeredCount = 0;

  for (let index = 0; index < questionIds.length; index += 1) {
    const question = getQuestionById(questionIds[index] as number);
    const response = responses[index];

    if (!question) {
      return NextResponse.json({ error: "Unknown question." }, { status: 400 });
    }

    if (response !== null && typeof response !== "string") {
      return NextResponse.json({ error: "Invalid answer." }, { status: 400 });
    }

    if (response !== null) {
      if (!question.answers.includes(response)) {
        return NextResponse.json({ error: "Invalid answer for question." }, { status: 400 });
      }

      answeredCount += 1;

      if (question.correctAnswer !== null && response === question.correctAnswer) {
        correctCount += 1;
      }
    }
  }

  const percentage = Math.round((correctCount / expectedCount) * 100);
  const verifiedTimeExpired = timeExpired === true;

  // Only the server is allowed to increment the public counter.
  const { data: nextCount, error: incrementError } = await supabaseAdmin.rpc("increment_mock_test_count");

  if (incrementError) {
    console.error("Could not record verified mock completion:", incrementError.message);
    return NextResponse.json({ error: "Could not record mock completion." }, { status: 500 });
  }

  // If the user is signed in, save the same server-verified result to their history.
  try {
    const userClient = await createServerClient();
    const { data: userData } = await userClient.auth.getUser();

    if (userData.user) {
      const { error: historyError } = await supabaseAdmin.from("mock_tests").insert({
        user_id: userData.user.id,
        format_id: formatId,
        question_count: expectedCount,
        correct_count: correctCount,
        answered_count: answeredCount,
        percentage,
        time_expired: verifiedTimeExpired,
      });

      if (historyError) {
        console.warn("Could not save verified mock history:", historyError.message);
      }
    }
  } catch (error) {
    console.warn("Could not resolve signed-in user for mock history:", error);
  }

  return NextResponse.json({
    verified: true,
    correctCount,
    answeredCount,
    percentage,
    count: Number(nextCount),
  });
}
