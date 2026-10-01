import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "push-unsubscribe", limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });

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
