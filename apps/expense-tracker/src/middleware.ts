import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// API routes authenticate the bearer token themselves.
const PUBLIC_PREFIXES = ["/login", "/register", "/auth/callback", "/offline", "/api/"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail fast and visibly in logs if the deploy is missing env vars, instead
  // of throwing inside Supabase's client and surfacing as MIDDLEWARE_INVOCATION_FAILED.
  if (!url || !key) {
    console.error("[middleware] Supabase env vars missing", { hasUrl: !!url, hasKey: !!key });
    return response;
  }

  const supabase = createServerClient(
    url,
    key,
    {
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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // getUser() may have refreshed the session, in which case Supabase wrote new
  // auth cookies onto `response` via setAll. A fresh NextResponse.redirect()
  // would drop them, the refreshed token would never reach the browser, and the
  // next request would look signed-out — bouncing the user back to /login.
  // So build the redirect and copy the pending cookies onto it.
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  };

  if (!user && !isPublic) {
    return redirectTo("/login");
  }

  if (user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
