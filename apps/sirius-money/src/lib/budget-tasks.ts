import "server-only";

import { moneyFormatter } from "@/components/functions";
import { currentCycle, type BudgetPeriod } from "@/lib/budgets";
import { formatAmount } from "@/lib/format-amount";
import { getT } from "@/lib/i18n/server";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface TaskBudget {
    id: string;
    title: string | null;
    amount: number;
    currency: string;
    amount_mnt: number;
    period: BudgetPeriod;
}

const toTaskBudget = (row: Record<string, unknown>): TaskBudget => ({
    id: String(row.id),
    title: (row.title as string | null) ?? null,
    amount: Number(row.amount),
    currency: String(row.currency),
    amount_mnt: Number(row.amount_mnt),
    period: row.period as BudgetPeriod,
});

// Claims the date before inserting, so concurrent calls never create the same task twice.
export async function ensureBudgetTask(
    supabase: Supabase,
    budget: TaskBudget,
    dueDate: string
): Promise<boolean> {
    const { data: claimed, error: claimError } = await supabase
        .from("ex_budget_tasks")
        .upsert(
            { budget_id: budget.id, due_date: dueDate },
            { onConflict: "budget_id,due_date", ignoreDuplicates: true }
        )
        .select("id");
    if (claimError) return false;
    const claim = claimed?.[0];
    if (!claim) return true;

    const t = await getT(budgetsDict);
    const isMnt = budget.currency === "MNT";
    const amount = isMnt
        ? moneyFormatter(budget.amount)
        : `${formatAmount(String(budget.amount))} ${budget.currency}`;
    const { data: task, error } = await supabase
        .from("do_tasks")
        .insert({
            title: t.task.title(budget.title ?? "", amount),
            notes: t.task.notes(
                t.periodOptions[budget.period],
                isMnt ? null : moneyFormatter(budget.amount_mnt)
            ),
            due_date: dueDate,
            priority: "medium",
        })
        .select("id")
        .single();

    if (error || !task) {
        // Release the claim so the next home load retries.
        await supabase.from("ex_budget_tasks").delete().eq("id", claim.id);
        return false;
    }
    await supabase.from("ex_budget_tasks").update({ task_id: task.id }).eq("id", claim.id);
    return true;
}

// Never throws: the home page must render even when tasks can't be synced.
export async function syncBudgetTasks(): Promise<void> {
    try {
        const supabase = await createClient();
        const { data: rows, error } = await supabase
            .from("ex_budgets")
            .select("id, title, amount, currency, amount_mnt, period, due_date, created_at")
            .eq("kind", "recurring")
            .eq("create_tasks", true);
        if (error || !rows?.length) return;

        const { data: existing } = await supabase
            .from("ex_budget_tasks")
            .select("budget_id, due_date")
            .in(
                "budget_id",
                rows.map((row) => row.id)
            );
        const handled = new Set(
            (existing ?? []).map((row) => `${row.budget_id}:${row.due_date}`)
        );

        for (const row of rows) {
            const dueDate = currentCycle({
                due_date: (row.due_date as string | null) ?? null,
                created_at: String(row.created_at),
                period: row.period as BudgetPeriod,
            }).nextDue;
            if (handled.has(`${row.id}:${dueDate}`)) continue;
            const ok = await ensureBudgetTask(supabase, toTaskBudget(row), dueDate);
            if (!ok) console.error("syncBudgetTasks: could not create task", row.id, dueDate);
        }
    } catch (error) {
        console.error("syncBudgetTasks", error);
    }
}
