import type { NextRequest } from "next/server";
import { guardSession } from "@workspace/sirius-core/supabase/proxy";

export async function proxy(request: NextRequest) {
  return guardSession(request, { app: "do", selfLogin: true, publicPrefixes: ["/login", "/auth/"] });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
