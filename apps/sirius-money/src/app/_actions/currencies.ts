"use server";

import { revalidatePath } from "next/cache";
import { isCurrencyCode } from "@/lib/currency-settings";
import { createClient } from "@/lib/supabase/server";

export async function setPreferredCurrencies(
    codes: string[]
): Promise<{ error: string } | { ok: true }> {
    if (!Array.isArray(codes) || codes.length > 60 || !codes.every(isCurrencyCode)) {
        return { error: "Invalid currencies" };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not signed in" };

    const { error } = await supabase
        .from("profiles")
        .update({ preferred_currencies: [...new Set(codes)] })
        .eq("id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    return { ok: true };
}
