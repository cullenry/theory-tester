import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "push-subscribe", limit: 10, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16 * 1024) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = rawBody as Record<string, unknown>;
  const keys = body.keys;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = keys && typeof keys === "object" && typeof (keys as Record<string, unknown>).p256dh === "string"
    ? String((keys as Record<string, unknown>).p256dh).trim()
    : "";
  const auth = keys && typeof keys === "object" && typeof (keys as Record<string, unknown>).auth === "string"
    ? String((keys as Record<string, unknown>).auth).trim()
    : "";

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  if (
    endpointUrl.protocol !== "https:" ||
    !p256dh ||
    !auth ||
    endpoint.length > 2048 ||
    p256dh.length > 512 ||
    auth.length > 512
  ) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert({
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
    }, { onConflict: "endpoint" });

  if (error) {
    console.error("Could not save push subscription:", error);
    return NextResponse.json({ error: "Could not save push subscription." }, { status: 500 });
  }

  await supabaseAdmin
    .from("user_app_preferences")
    .upsert({
      user_id: user.id,
      reminders_enabled: true,
      reminder_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Dublin",
    }, { onConflict: "user_id" });

  return NextResponse.json({ subscribed: true });
}
