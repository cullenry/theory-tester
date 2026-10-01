import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const CANONICAL_HOST = "theoryprep.irish";
const LEGACY_HOSTS = new Set(["theory-tester-nu.vercel.app", "www.theoryprep.irish"]);

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (LEGACY_HOSTS.has(hostname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";
    redirectUrl.hostname = CANONICAL_HOST;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
