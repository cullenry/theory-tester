import { NextResponse } from "next/server";
import { getQuestionById } from "@/lib/questions";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { validateMockTestCompletion } from "@/lib/security/mock-test-completion";
import { readJsonBody } from "@/lib/security/read-json-body";

const MAX_COMPLETION_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "mock-test-complete", limit: 6, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const parsedBody = await readJsonBody(request, MAX_COMPLETION_BODY_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const completion = validateMockTestCompletion(parsedBody.value, getQuestionById);
  if (!completion) {
    return NextResponse.json({ error: "Invalid mock test payload." }, { status: 400 });
  }

  const { formatId, expectedCount, correctCount, answeredCount, percentage, timeExpired } = completion;

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
        time_expired: timeExpired,
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
