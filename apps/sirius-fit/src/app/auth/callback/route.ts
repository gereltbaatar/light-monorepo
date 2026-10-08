import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { safeNext } from "@workspace/sirius-core/lib/apps";
import { browserOrigin } from "@workspace/sirius-core/lib/origin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const origin = browserOrigin(await headers(), request.url);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  return NextResponse.redirect(next.startsWith("/") ? `${origin}${next}` : next);
}
