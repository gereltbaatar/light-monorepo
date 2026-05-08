"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionResult = { error: string } | { ok: true };

export async function updateDisplayName(
    _prev: ProfileActionResult | undefined,
    formData: FormData
): Promise<ProfileActionResult> {
    const raw = String(formData.get("display_name") ?? "").trim();

    if (raw.length === 0) {
        return { error: "Name cannot be empty" };
    }
    if (raw.length > 60) {
        return { error: "Name must be 60 characters or fewer" };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not signed in" };
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
