import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : type === "recovery"
        ? "/reset-password"
        : "/";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(
      safeNext === "/reset-password" ? "/reset-password?error=invalid" : "/login?error=auth",
      url.origin,
    ));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "email",
  });

  if (error) {
    const errorUrl = new URL(safeNext, url.origin);
    errorUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
