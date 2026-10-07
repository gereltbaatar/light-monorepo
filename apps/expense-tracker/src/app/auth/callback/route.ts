import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * The browser-visible origin to redirect back to.
 *
 * `new URL(request.url).origin` is NOT safe here: `next dev -H 0.0.0.0` (and any
 * deploy behind a proxy) makes request.url carry the bind address, so the user
 * gets bounced to an unreachable http://0.0.0.0:3000. Prefer the forwarded
 * headers a proxy sets, then the Host header, and only fall back to request.url.
 */
async function resolveOrigin(request: Request): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (host) {
    const proto =
      headerList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = await resolveOrigin(request);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  return NextResponse.redirect(`${origin}/`);
}
