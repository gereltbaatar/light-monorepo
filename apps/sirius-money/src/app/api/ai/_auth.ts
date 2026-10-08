import { createClient } from "@/lib/supabase/server";

// Rejects calls without a valid Supabase session before any Gemini spend.
export async function requireUser(): Promise<Response | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user ? null : Response.json({ error: "Unauthorized" }, { status: 401 });
}
