import "server-only";

import { createClient } from "@/lib/supabase/server";

export type GoalKind = "savings" | "plan";
export type GoalCategory = "general" | "travel" | "gadget" | "home" | "emergency";
export type GoalPeriod = "weekly" | "monthly" | "yearly";

export interface Goal {
    id: string;
    kind: GoalKind;
    title: string;
    image_url: string | null;
    target_amount: number;
    saved_amount: number;
    category: GoalCategory;
    target_date: string | null;
    contribution_amount: number | null;
    contribution_period: GoalPeriod | null;
    start_date: string | null;
    status: "active" | "completed" | "archived";
    created_at: string;
}

export interface GoalContribution {
    id: string;
    amount: number;
    direction: "deposit" | "withdrawal";
    contributed_on: string;
    note: string | null;
}

const GOAL_COLUMNS =
    "id, kind, title, image_url, target_amount, saved_amount, category, target_date, contribution_amount, contribution_period, start_date, status, created_at";

// numeric columns arrive as strings from PostgREST.
const toGoal = (row: Record<string, unknown>): Goal =>
    ({
        ...row,
        target_amount: Number(row.target_amount),
        saved_amount: Number(row.saved_amount),
        contribution_amount:
            row.contribution_amount == null ? null : Number(row.contribution_amount),
    }) as Goal;

export async function getGoals(): Promise<Goal[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_goal_progress")
        .select(GOAL_COLUMNS)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(toGoal);
}

export async function getGoal(id: string): Promise<Goal | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_goal_progress")
        .select(GOAL_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error || !data) return null;
    return toGoal(data);
}

export async function getGoalContributions(
    goalId: string
): Promise<GoalContribution[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_goal_contributions")
        .select("id, amount, direction, contributed_on, note")
        .eq("goal_id", goalId)
        .order("contributed_on", { ascending: false })
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({ ...row, amount: Number(row.amount) })) as GoalContribution[];
}
