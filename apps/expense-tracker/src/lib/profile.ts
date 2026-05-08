import { createClient } from "@/lib/supabase/server";

export type Profile = {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: "user" | "admin";
    notifications_paused: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
};

/**
 * Fetches the current user's profile row. Returns null if no session or no
 * profile row exists. Middleware guards protected routes, so under normal
 * navigation a logged-in user always has a session here.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error || !data) return null;

    return data as Profile;
}

/**
 * Builds a friendly display name with sensible fallbacks:
 * 1. profile.display_name if set
 * 2. local-part of the email
 * 3. literal "User"
 */
export function getDisplayName(profile: Profile | null): string {
    if (!profile) return "User";
    if (profile.display_name) return profile.display_name;
    const local = profile.email.split("@")[0];
    return local || "User";
}
