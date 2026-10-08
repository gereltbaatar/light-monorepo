import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { browserOrigin } from "@workspace/sirius-core/lib/origin";

// Every Sirius app posts here, so sign-out lives in one place.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = browserOrigin(await headers(), request.url);
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
