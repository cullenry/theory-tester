import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/security/read-json-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "push-unsubscribe", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsedBody = await readJsonBody(request, 4 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }

  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint || endpoint.length > 2048) {
    return NextResponse.json({ error: "Invalid subscription endpoint." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Could not remove push subscription:", error);
    return NextResponse.json({ error: "Could not remove subscription." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: false });
}
