import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, type SiriusAppId } from "../lib/apps";
import { browserOrigin } from "../lib/origin";
import { cookieOptions } from "./cookie-options";

interface GuardOptions {
  app: SiriusAppId;
  publicPrefixes?: string[];
  selfLogin?: boolean;
}

// Refreshes the session and sends signed-out visitors to a login page.
export async function guardSession(request: NextRequest, { app, publicPrefixes = [], selfLogin = app === "life" }: GuardOptions) {
  const response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[proxy] Supabase env vars missing", { hasUrl: !!url, hasKey: !!key });
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const origin = browserOrigin(request.headers, request.url);
  const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));

  // A fresh redirect would drop the refreshed auth cookies; carry them over.
  const redirectTo = (target: string) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && !isPublic) {
    const login = new URL(selfLogin ? `${origin}/login` : appUrl("life", "/login"));
    login.searchParams.set("next", `${origin}${pathname}${search}`);
    return redirectTo(login.toString());
  }

  if (user && selfLogin && pathname.startsWith("/login")) {
    return redirectTo(`${origin}/`);
  }

  return response;
}
