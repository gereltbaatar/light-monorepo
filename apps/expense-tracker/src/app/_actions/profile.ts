"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";

export type ProfileActionResult = { error: string } | { ok: true };

export async function updateDisplayName(
    _prev: ProfileActionResult | undefined,
    formData: FormData
): Promise<ProfileActionResult> {
    const t = (await getT(profileDict)).errors;
    const raw = String(formData.get("display_name") ?? "").trim();

    if (raw.length === 0) {
        return { error: t.nameEmpty };
    }
    if (raw.length > 60) {
        return { error: t.nameTooLong };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: t.notSignedIn };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ display_name: raw })
        .eq("id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/profile/general");
    revalidatePath("/");
    return { ok: true };
}

export async function updateAvatarUrl(
    url: string
): Promise<ProfileActionResult> {
    const t = (await getT(profileDict)).errors;
    if (!url.startsWith("https://res.cloudinary.com/")) {
        return { error: t.invalidAvatar };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: t.notSignedIn };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/profile/general");
    revalidatePath("/");
    return { ok: true };
}
