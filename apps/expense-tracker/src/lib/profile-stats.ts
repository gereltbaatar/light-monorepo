import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ProfileStats {
    totalTransactions: number;
    monthTransactions: number;
    monthSpent: number;
    lastSignInAt: string | null;
    activeGoals: number;
    completedGoals: number;
}

const isoDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function getProfileStats(): Promise<ProfileStats> {
    const supabase = await createClient();
    const now = new Date();
    const monthStart = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));

    const [user, total, month, goals] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("type, amount").gte("occurred_at", monthStart),
        supabase.from("goals").select("status").neq("status", "archived"),
    ]);

    const monthRows = month.data ?? [];
    const goalRows = goals.data ?? [];

    return {
        totalTransactions: total.count ?? 0,
        monthTransactions: monthRows.length,
        monthSpent: monthRows
            .filter((row) => row.type === "expense")
            .reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        lastSignInAt: user.data.user?.last_sign_in_at ?? null,
        activeGoals: goalRows.filter((row) => row.status === "active").length,
        completedGoals: goalRows.filter((row) => row.status === "completed").length,
    };
}
