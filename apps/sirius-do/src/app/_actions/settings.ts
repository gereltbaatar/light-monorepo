"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";

export type SettingsActionResult = { error: string } | { ok: true } | undefined;

export async function setLocale(locale: string): Promise<SettingsActionResult> {
  if (!isLocale(locale)) return { error: "Unsupported language" };

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

async function updateProfile(fields: { display_name?: string; avatar_url?: string }): Promise<SettingsActionResult> {
  const t = (await getT()).errors;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.notSignedIn };

  const { error } = await supabase.from("profiles").update(fields).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateDisplayName(_prev: SettingsActionResult, formData: FormData): Promise<SettingsActionResult> {
  const t = (await getT()).errors;
  const name = String(formData.get("display_name") ?? "").trim();
  if (!name) return { error: t.nameEmpty };
  if (name.length > 60) return { error: t.nameTooLong };

  return updateProfile({ display_name: name });
}

export async function updateAvatarUrl(url: string): Promise<SettingsActionResult> {
  if (!url.startsWith("https://res.cloudinary.com/")) return { error: (await getT()).errors.invalidAvatar };

  return updateProfile({ avatar_url: url });
}
