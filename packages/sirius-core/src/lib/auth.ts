import "server-only";

import { cache } from "react";
import { createClient } from "../supabase/server";
import { DEFAULT_TIMEZONE, monthRange, todayIn, weekRange } from "./date";
import type { Profile } from "./types";

const FALLBACK_PROFILE: Omit<Profile, "id" | "email"> = {
  display_name: null,
  avatar_url: null,
  timezone: DEFAULT_TIMEZONE,
  currency: "MNT",
  week_starts_on: 1,
};

// Cached per request so every domain query shares one profile read.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, timezone, currency, week_starts_on")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? { id: user.id, email: user.email ?? "", ...FALLBACK_PROFILE };
});

// "Today" in the user's timezone, so every app agrees on dates.
export async function getClock() {
  const profile = await getProfile();
  const today = todayIn(profile?.timezone ?? DEFAULT_TIMEZONE);

  return {
    profile,
    today,
    week: weekRange(today, profile?.week_starts_on ?? 1),
    month: monthRange(today),
  };
}
