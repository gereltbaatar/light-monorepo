"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";

export type GoalActionResult = { error: string } | { ok: true; id?: string };

export interface CreateGoalInput {
    kind: "savings" | "plan";
    title: string;
    imageUrl?: string;
    targetAmount: number;
    category?: "general" | "travel" | "gadget" | "home" | "emergency";
    targetDate?: string;
    initialAmount?: number;
    contributionAmount?: number;
    contributionPeriod?: "weekly" | "monthly" | "yearly";
    startDate?: string;
    autoContribute?: boolean;
    remindOnDue?: boolean;
    remindOnMilestone?: boolean;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = ["general", "travel", "gadget", "home", "emergency"];
const PERIODS = ["weekly", "monthly", "yearly"];

const isPositive = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

const tableMissing = (message: string) =>
    message.includes("Could not find the table") || message.includes("does not exist");

function revalidateGoals(id?: string) {
    revalidatePath("/");
    if (id) revalidatePath(`/goals/${id}`);
}

export async function createGoal(input: CreateGoalInput): Promise<GoalActionResult> {
    const { errors } = await getT(goalsDict);
    const title = input.title?.trim();
    if (!title) return { error: errors.titleRequired };
    if (!isPositive(input.targetAmount)) return { error: errors.targetPositive };
    if (input.kind !== "savings" && input.kind !== "plan") return { error: errors.invalidKind };
    if (input.imageUrl && !input.imageUrl.startsWith("https://res.cloudinary.com/")) {
        return { error: errors.invalidImage };
    }
    if (input.category && !CATEGORIES.includes(input.category)) {
        return { error: errors.invalidCategory };
    }
    if (input.targetDate && !DATE_PATTERN.test(input.targetDate)) {
        return { error: errors.invalidTargetDate };
    }
    if (input.kind === "plan") {
        if (!isPositive(input.contributionAmount)) {
            return { error: errors.contributionPositive };
        }
        if (!input.contributionPeriod || !PERIODS.includes(input.contributionPeriod)) {
            return { error: errors.pickPeriod };
        }
        if (!input.startDate || !DATE_PATTERN.test(input.startDate)) {
            return { error: errors.pickStartDate };
        }
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: errors.signedOut };

    const isPlan = input.kind === "plan";
    const { data, error } = await supabase
        .from("goals")
        .insert({
            user_id: user.id,
            kind: input.kind,
            title,
            image_url: input.imageUrl ?? null,
            target_amount: input.targetAmount,
            category: input.category ?? "general",
            target_date: input.targetDate || null,
            contribution_amount: isPlan ? input.contributionAmount : null,
            contribution_period: isPlan ? input.contributionPeriod : null,
            start_date: isPlan ? input.startDate : null,
            auto_contribute: isPlan && !!input.autoContribute,
            remind_on_due: !!input.remindOnDue,
            remind_on_milestone: !!input.remindOnMilestone,
        })
        .select("id")
        .single();

    if (error || !data) {
        if (error && tableMissing(error.message)) {
            return { error: errors.tableMissing };
        }
        return { error: error?.message ?? errors.createFailed };
    }

    // "Already saved" is recorded as the first deposit so progress keeps one source of truth.
    if (isPositive(input.initialAmount)) {
        const { error: depositError } = await supabase.from("goal_contributions").insert({
            goal_id: data.id,
            user_id: user.id,
            amount: input.initialAmount,
            direction: "deposit",
            note: errors.startingAmount,
        });
        if (depositError) return { error: depositError.message };
    }

    revalidateGoals();
    return { ok: true, id: data.id };
}

export async function addContribution(
    goalId: string,
    input: { amount: number; direction: "deposit" | "withdrawal"; note?: string }
): Promise<GoalActionResult> {
    const { errors } = await getT(goalsDict);
    if (!isPositive(input.amount)) return { error: errors.amountPositive };
    if (input.direction !== "deposit" && input.direction !== "withdrawal") {
        return { error: errors.invalidDirection };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: errors.signedOut };

    if (input.direction === "withdrawal") {
        const { data: current } = await supabase
            .from("goal_progress")
            .select("saved_amount")
            .eq("id", goalId)
            .maybeSingle();
        if (!current) return { error: errors.notFound };
        if (input.amount > Number(current.saved_amount)) {
            return { error: errors.overWithdraw };
        }
    }

    const { error } = await supabase.from("goal_contributions").insert({
        goal_id: goalId,
        user_id: user.id,
        amount: input.amount,
        direction: input.direction,
        note: input.note?.trim() || null,
    });
    if (error) return { error: error.message };

    // Flip status when the target is crossed in either direction.
    const { data: goal } = await supabase
        .from("goal_progress")
        .select("saved_amount, target_amount, status")
        .eq("id", goalId)
        .maybeSingle();
    if (goal && goal.status !== "archived") {
        const reached = Number(goal.saved_amount) >= Number(goal.target_amount);
        const status = reached ? "completed" : "active";
        if (status !== goal.status) {
            await supabase
                .from("goals")
                .update({ status, completed_at: reached ? new Date().toISOString() : null })
                .eq("id", goalId);
        }
    }

    revalidateGoals(goalId);
    return { ok: true };
}

export async function deleteGoal(goalId: string): Promise<GoalActionResult> {
    const { errors } = await getT(goalsDict);
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId)
        .select("id");

    if (error) return { error: error.message };
    if (!data?.length) return { error: errors.notFound };

    revalidateGoals();
    return { ok: true };
}
