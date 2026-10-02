import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/security/read-json-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = rateLimit(request, { scope: "account-delete", limit: 3, windowMs: 10 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsedBody = await readJsonBody(request, 8 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.status === 413 ? parsedBody.error : "Invalid request." },
      { status: parsedBody.status },
    );
  }
  const body = parsedBody.value;

  const confirmation =
    body && typeof body === "object" && "confirmation" in body &&
    typeof body.confirmation === "string"
      ? body.confirmation
      : "";

  if (confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Could not delete account:", error);
    return NextResponse.json({ error: "Could not delete your account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
