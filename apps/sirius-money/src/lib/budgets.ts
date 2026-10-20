import "server-only";

import {
    addMonths,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    format,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from "date-fns";
import { toCategory, type Category } from "@/lib/categories";
import { SUBSCRIPTION_ICON_IDS, type SubscriptionIconId } from "@/lib/subscription-icons";
import { createClient } from "@/lib/supabase/server";

export type BudgetKind = "recurring" | "limit";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
    id: string;
    kind: BudgetKind;
    title: string | null;
    icon: SubscriptionIconId | null;
    category: Category | null;
    amount: number;
    currency: string;
    amount_mnt: number;
    period: BudgetPeriod;
    warning_percent: number | null;
    due_date: string | null;
    remind_days_before: number;
    auto_repeat: boolean;
    created_at: string;
    create_tasks: boolean;
    /** Limit only: first day of the current period, YYYY-MM-DD. */
    period_start: string | null;
    /** Limit: share of the limit spent this period; recurring: share of the cycle elapsed. */
    percent: number;
    /** Limit only, in tugriks. */
    spent: number | null;
    /** Recurring only, YYYY-MM-DD. */
    next_due: string | null;
}

const isoDay = (date: Date) => format(date, "yyyy-MM-dd");

const addPeriod = (date: Date, period: BudgetPeriod, n: number) =>
    period === "weekly" ? addWeeks(date, n) : period === "monthly" ? addMonths(date, n) : addYears(date, n);

const periodStart = (period: BudgetPeriod, today: Date) =>
    period === "weekly"
        ? startOfWeek(today, { weekStartsOn: 1 })
        : period === "monthly"
          ? startOfMonth(today)
          : startOfYear(today);

// Steps from the anchor by whole periods so a 31st due date never drifts to the 28th.
function recurringCycle(anchor: Date, period: BudgetPeriod, today: Date) {
    let n = 0;
    while (addPeriod(anchor, period, n) < today) n++;
    const next = addPeriod(anchor, period, n);
    const prev = addPeriod(anchor, period, n - 1);
    const elapsed = differenceInCalendarDays(today, prev) / differenceInCalendarDays(next, prev);
    return { next, percent: Math.max(0, Math.min(100, Math.round(elapsed * 100))) };
}

const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// The recurring cycle a budget is in today; anchored on its due date, else its creation day.
export function currentCycle(
    budget: { due_date: string | null; created_at: string; period: BudgetPeriod },
    today = startOfToday()
) {
    const anchor = budget.due_date
        ? new Date(`${budget.due_date}T00:00:00`)
        : new Date(budget.created_at);
    const cycle = recurringCycle(
        new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
        budget.period,
        today
    );
    return { nextDue: isoDay(cycle.next), percent: cycle.percent };
}

export interface BudgetExpense {
    id: string;
    title: string;
    amount: number;
    occurred_at: string;
}

const BUDGET_COLUMNS =
    "id, kind, title, icon, category, amount, currency, amount_mnt, period, due_date, remind_days_before, auto_repeat, warning_percent, created_at";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Still reads budgets before supabase-budget-tasks.sql adds create_tasks.
async function selectBudgets(supabase: Supabase, id?: string) {
    const run = (columns: string) => {
        const query = supabase.from("ex_budgets").select(columns);
        return id ? query.eq("id", id) : query.order("created_at", { ascending: false });
    };
    let { data, error } = await run(`${BUDGET_COLUMNS}, create_tasks`);
    if (error?.code === "42703") ({ data, error } = await run(BUDGET_COLUMNS));
    return error || !data ? [] : (data as unknown as Array<Record<string, unknown>>);
}

export async function getBudgets(): Promise<Budget[]> {
    const supabase = await createClient();
    // Missing table (migration not run) reads as no budgets.
    return withProgress(supabase, await selectBudgets(supabase));
}

export async function getBudget(id: string): Promise<Budget | null> {
    const supabase = await createClient();
    const rows = await selectBudgets(supabase, id);
    return (await withProgress(supabase, rows))[0] ?? null;
}

// The current period's expenses that count against a limit budget.
export async function getBudgetExpenses(budget: Budget): Promise<BudgetExpense[]> {
    if (budget.kind !== "limit" || !budget.category || !budget.period_start) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("ex_transactions")
        .select("id, title, amount, occurred_at")
        .eq("type", "expense")
        .eq("category", budget.category)
        .gte("occurred_at", budget.period_start)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        amount: Number(row.amount),
        occurred_at: String(row.occurred_at),
    }));
}

async function withProgress(
    supabase: Supabase,
    data: Array<Record<string, unknown>>
): Promise<Budget[]> {
    const today = startOfToday();
    const limits = data.filter((row) => row.kind === "limit");
    const earliest = limits.reduce<Date | null>((min, row) => {
        const start = periodStart(row.period as BudgetPeriod, today);
        return !min || start < min ? start : min;
    }, null);

    let expenses: Array<{ amount: number; category: Category; day: string }> = [];
    if (earliest) {
        const { data: rows } = await supabase
            .from("ex_transactions")
            .select("amount, category, occurred_at")
            .eq("type", "expense")
            .gte("occurred_at", isoDay(earliest));
        expenses = (rows ?? []).map((row) => ({
            amount: Number(row.amount),
            category: toCategory(row.category),
            day: String(row.occurred_at),
        }));
    }

    return data.map((row): Budget => {
        const period = row.period as BudgetPeriod;
        const amountMnt = Number(row.amount_mnt);
        const icon = SUBSCRIPTION_ICON_IDS.includes(row.icon as SubscriptionIconId)
            ? (row.icon as SubscriptionIconId)
            : null;
        const base = {
            id: row.id as string,
            kind: row.kind as BudgetKind,
            title: (row.title as string | null) ?? null,
            icon,
            category: row.category ? toCategory(row.category) : null,
            amount: Number(row.amount),
            currency: row.currency as string,
            amount_mnt: amountMnt,
            period,
            warning_percent: (row.warning_percent as number | null) ?? null,
            due_date: (row.due_date as string | null) ?? null,
            remind_days_before: Number(row.remind_days_before ?? 0),
            auto_repeat: row.auto_repeat === true,
            created_at: String(row.created_at),
            create_tasks: row.create_tasks === true,
        };

        if (base.kind === "limit") {
            const from = isoDay(periodStart(period, today));
            const spent = expenses
                .filter((e) => e.category === base.category && e.day >= from)
                .reduce((sum, e) => sum + e.amount, 0);
            return {
                ...base,
                spent,
                percent: Math.round((spent / amountMnt) * 100),
                period_start: from,
                next_due: null,
            };
        }

        const cycle = currentCycle(base, today);
        return {
            ...base,
            spent: null,
            percent: cycle.percent,
            period_start: null,
            next_due: cycle.nextDue,
        };
    });
}
