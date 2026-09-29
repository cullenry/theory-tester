import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint.startsWith("https://") || !p256dh || !auth || endpoint.length > 2048) {
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
