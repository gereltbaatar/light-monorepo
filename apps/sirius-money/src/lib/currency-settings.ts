import "server-only";

import { createClient } from "@/lib/supabase/server";

export const DEFAULT_CURRENCIES = ["USD"];

export const isCurrencyCode = (value: unknown): value is string =>
    typeof value === "string" && /^[A-Z]{3}$/.test(value);

// Falls back to the default when signed out or the column is not migrated yet.
export async function getPreferredCurrencies(): Promise<string[]> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return DEFAULT_CURRENCIES;

    const { data } = await supabase
        .from("profiles")
        .select("preferred_currencies")
        .eq("id", user.id)
        .maybeSingle();
    const codes: unknown = data?.preferred_currencies;
    return Array.isArray(codes) ? codes.filter(isCurrencyCode) : DEFAULT_CURRENCIES;
}
