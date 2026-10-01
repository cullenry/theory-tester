import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pushConfigured, sendTheoryPrepPush } from "@/lib/push-server";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "push-test", limit: 3, windowMs: 10 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  if (!pushConfigured) return NextResponse.json({ error: "Push is not configured yet." }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Could not load subscriptions." }, { status: 500 });

  let sent = 0;
  for (const subscription of subscriptions ?? []) {
    try {
      await sendTheoryPrepPush(subscription, {
        title: "TheoryPrep is ready 🚗",
        body: "Your notifications are working. A little theory practice is waiting.",
        url: "/practice/learn",
        tag: "theoryprep-test",
      });
      sent += 1;
    } catch (pushError) {
      const statusCode = (pushError as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}