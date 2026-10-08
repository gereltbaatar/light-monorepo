"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { safeNext } from "@workspace/sirius-core/lib/apps";
import { browserOrigin } from "@workspace/sirius-core/lib/origin";

export type AuthActionResult = { error: string } | undefined;

export async function signInWithEmail(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next") as string | null);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function signInWithGoogle(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const headerList = await headers();
  const origin = headerList.get("origin") ?? browserOrigin(headerList);

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNext(formData.get("next") as string | null));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
