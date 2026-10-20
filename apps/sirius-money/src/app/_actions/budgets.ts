"use server";

import { revalidatePath } from "next/cache";
import { EXPENSE_CATEGORY_KEYS, type Category } from "@/lib/categories";
import { currentCycle } from "@/lib/budgets";
import { ensureBudgetTask } from "@/lib/budget-tasks";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getT } from "@/lib/i18n/server";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { SUBSCRIPTION_ICON_IDS, type SubscriptionIconId } from "@/lib/subscription-icons";
import { createClient } from "@/lib/supabase/server";

export type BudgetActionResult =
    | { error: string }
    | { ok: true; id: string; taskFailed?: boolean };

export interface CreateBudgetInput {
    kind: "recurring" | "limit";
    amount: number;
    currency: string;
    period: "weekly" | "monthly" | "yearly";
    title?: string;
    icon?: string;
    dueDate?: string;
    remindDaysBefore?: number;
    autoRepeat?: boolean;
    createTasks?: boolean;
    category?: string;
    warningPercent?: number;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERIODS = ["weekly", "monthly", "yearly"];

const isPositive = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

const isIntBetween = (n: unknown, min: number, max: number): n is number =>
    Number.isInteger(n) && (n as number) >= min && (n as number) <= max;

const tableMissing = (message: string) =>
    message.includes("Could not find the table") || message.includes("does not exist");

// PostgREST reports an unknown insert column as PGRST204, Postgres as 42703.
const columnMissing = (code?: string) => code === "PGRST204" || code === "42703";

export async function createBudget(input: CreateBudgetInput): Promise<BudgetActionResult> {
    const { errors } = await getT(budgetsDict);
    const isRecurring = input.kind === "recurring";
    if (!isRecurring && input.kind !== "limit") return { error: errors.invalid };
    if (!isPositive(input.amount)) return { error: errors.amountPositive };
    if (!PERIODS.includes(input.period)) return { error: errors.invalid };

    const title = input.title?.trim();
    const icon = input.icon || null;
    if (isRecurring) {
        if (!title) return { error: errors.titleRequired };
        if (icon && !SUBSCRIPTION_ICON_IDS.includes(icon as SubscriptionIconId)) {
            return { error: errors.invalid };
        }
        if (input.dueDate && !DATE_PATTERN.test(input.dueDate)) return { error: errors.invalid };
        if (!isIntBetween(input.remindDaysBefore ?? 0, 0, 10)) return { error: errors.invalid };
    } else {
        if (!EXPENSE_CATEGORY_KEYS.includes(input.category as Category)) {
            return { error: errors.invalid };
        }
        if (!isIntBetween(input.warningPercent, 1, 100)) return { error: errors.invalid };
    }

    // Converted here rather than trusted from the client.
    let amountMnt = input.amount;
    if (input.currency !== "MNT") {
        const rate = (await getExchangeRates())?.rates.find((r) => r.code === input.currency);
        if (!rate) return { error: errors.rateUnavailable };
        amountMnt = Math.round(input.amount * rate.rate);
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: errors.signedOut };

    const createTasks = isRecurring && !!input.createTasks;
    const { data, error } = await supabase
        .from("ex_budgets")
        .insert({
            user_id: user.id,
            kind: input.kind,
            title: isRecurring ? title : null,
            icon: isRecurring ? icon : null,
            category: isRecurring ? null : input.category,
            amount: input.amount,
            currency: input.currency,
            amount_mnt: amountMnt,
            period: input.period,
            due_date: isRecurring ? input.dueDate || null : null,
            remind_days_before: isRecurring ? (input.remindDaysBefore ?? 0) : 0,
            auto_repeat: isRecurring && !!input.autoRepeat,
            warning_percent: isRecurring ? null : input.warningPercent,
            // Sent only when on, so budgets still save before the tasks migration.
            ...(createTasks && { create_tasks: true }),
        })
        .select("id, due_date, created_at")
        .single();

    if (error || !data) {
        if (error && columnMissing(error.code)) return { error: errors.tasksMigrationMissing };
        if (error && tableMissing(error.message)) return { error: errors.tableMissing };
        return { error: error?.message ?? errors.createFailed };
    }

    let taskFailed = false;
    if (createTasks) {
        const { nextDue } = currentCycle({
            due_date: data.due_date,
            created_at: data.created_at,
            period: input.period,
        });
        taskFailed = !(await ensureBudgetTask(
            supabase,
            {
                id: data.id,
                title: title ?? null,
                amount: input.amount,
                currency: input.currency,
                amount_mnt: amountMnt,
                period: input.period,
            },
            nextDue
        ));
    }

    revalidatePath("/");
    return { ok: true, id: data.id, taskFailed };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteBudget(id: string): Promise<{ error: string } | { ok: true }> {
    const { errors } = await getT(budgetsDict);
    if (!UUID_PATTERN.test(id)) return { error: errors.invalid };

    const supabase = await createClient();
    // Unfinished tasks go with the budget; done ones stay in sirius-do as history.
    const { data: links } = await supabase
        .from("ex_budget_tasks")
        .select("task_id")
        .eq("budget_id", id)
        .not("task_id", "is", null);
    const taskIds = (links ?? []).map((link) => link.task_id as string);
    if (taskIds.length > 0) {
        await supabase.from("do_tasks").delete().in("id", taskIds).eq("status", "todo");
    }

    const { error } = await supabase.from("ex_budgets").delete().eq("id", id);
    if (error) return { error: errors.deleteFailed };

    revalidatePath("/");
    return { ok: true };
}
