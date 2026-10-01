import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  // Supabase's browser recovery flow can return the session in the URL hash.
  // The server cannot read that hash, so let the dedicated reset page handle
  // the browser-side recovery session instead of incorrectly sending the user to login.
  if (safeNext === "/reset-password") {
    return NextResponse.redirect(new URL("/reset-password", url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
