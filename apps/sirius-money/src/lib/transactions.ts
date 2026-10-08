import "server-only";

import { createClient } from "@/lib/supabase/server";
import { sanitizeItems, type ReceiptItem } from "@/lib/receipt-items";
import { toCategory, type Category } from "@/lib/categories";

export interface Transaction {
    id: string;
    type: "expense" | "income";
    title: string;
    /** Positive magnitude; direction lives in `type`. */
    amount: number;
    /** yyyy-mm-dd */
    occurred_at: string;
    receipt_url: string | null;
    created_at: string;
    category: Category;
}

/**
 * The current user's transactions, newest first.
 *
 * RLS scopes rows to the signed-in user, so no user_id filter is needed here —
 * but an unauthenticated caller would simply get an empty set rather than an
 * error, so callers that require a session must check it themselves.
 */
export async function getTransactions(limit = 50): Promise<Transaction[]> {
    const supabase = await createClient();

    const columns = "id, type, title, amount, occurred_at, receipt_url, created_at";
    const query = (select: string) =>
        supabase
            .from("ex_transactions")
            .select(select)
            .order("occurred_at", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(limit);

    let { data, error } = await query(`${columns}, category`);

    // Still list transactions before the category column has been added.
    if (error?.code === "42703") {
        ({ data, error } = await query(columns));
    }

    if (error || !data) return [];

    return (data as unknown as Array<Record<string, unknown>>).map((row) => ({
        ...row,
        // numeric(14,2) arrives as a string from PostgREST.
        amount: Number(row.amount),
        category: toCategory(row.category),
    })) as Transaction[];
}

export interface TransactionDetail extends Transaction {
    items: ReceiptItem[];
}

export async function getTransaction(
    id: string
): Promise<TransactionDetail | null> {
    const supabase = await createClient();

    const columns = "id, type, title, amount, occurred_at, receipt_url, created_at";
    let { data, error } = await supabase
        .from("ex_transactions")
        .select(`${columns}, items`)
        .eq("id", id)
        .maybeSingle();

    // Still render the page before the items column has been added.
    if (error?.code === "42703") {
        ({ data, error } = await supabase
            .from("ex_transactions")
            .select(columns)
            .eq("id", id)
            .maybeSingle());
    }

    if (error || !data) return null;

    return {
        ...data,
        amount: Number(data.amount),
        category: toCategory((data as { category?: unknown }).category),
        items: sanitizeItems((data as { items?: unknown }).items),
    } as TransactionDetail;
}

export interface BalanceSummary {
    income: number;
    expense: number;
    /** income − expense; may be negative. */
    net: number;
}

/** Lifetime totals for the current user. */
export async function getBalanceSummary(): Promise<BalanceSummary> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_transactions")
        .select("type, amount");

    if (error || !data) return { income: 0, expense: 0, net: 0 };

    let income = 0;
    let expense = 0;
    for (const row of data) {
        const amount = Number(row.amount);
        if (!Number.isFinite(amount)) continue;
        if (row.type === "income") income += amount;
        else expense += amount;
    }

    return { income, expense, net: income - expense };
}

export type StatsPeriod = "week" | "month" | "year";

export interface SpendingStats {
    period: StatsPeriod;
    spent: number;
    earned: number;
    count: number;
    /** Change vs the previous period; null when that period had none. */
    spentChangePercent: number | null;
    earnedChangePercent: number | null;
    /** Totals per point up to today, oldest first: days for a week or month, months for a year. */
    series: Array<{ label: string; tick: string; income: number; expense: number }>;
    /** Expense totals per category, largest first. */
    byCategory: Array<{ category: Category; amount: number; percent: number }>;
    topExpenses: Array<{ title: string; amount: number; category: Category; occurredAt: string }>;
}

const isoDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const MONTH_DAYS = 30;

// Rolling windows ending today, e.g. October through this September.
function periodRange(period: StatsPeriod, now: Date) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "week") {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        const prev = new Date(start);
        prev.setDate(prev.getDate() - 7);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return { prev, start, end };
    }
    if (period === "month") {
        const start = new Date(today);
        start.setDate(start.getDate() - (MONTH_DAYS - 1));
        const prev = new Date(start);
        prev.setDate(prev.getDate() - MONTH_DAYS);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return { prev, start, end };
    }
    return {
        prev: new Date(now.getFullYear(), now.getMonth() - 23, 1),
        start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
}

const changePercent = (current: number, previous: number) =>
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

/**
 * Aggregates for the stats screen over one period, plus the period before it
 * for the change figure. Done in JS: a personal ledger is small enough that one
 * indexed range scan beats maintaining views or RPCs.
 */
export async function getSpendingStats(
    period: StatsPeriod,
    intlLocale: string
): Promise<SpendingStats> {
    const supabase = await createClient();
    const now = new Date();
    const { prev, start, end } = periodRange(period, now);

    const query = (select: string) =>
        supabase
            .from("ex_transactions")
            .select(select)
            .gte("occurred_at", isoDay(prev))
            .lt("occurred_at", isoDay(end));

    const columns = "type, title, amount, occurred_at";
    let { data, error } = await query(`${columns}, category`);
    // Still render before the category column has been added.
    if (error?.code === "42703") {
        ({ data, error } = await query(columns));
    }

    const rows = error || !data ? [] : (data as unknown as Array<Record<string, unknown>>);

    // Points stop at today so the line doesn't flatten out over days that haven't happened.
    const series: SpendingStats["series"] = [];
    const pointOf: (d: Date) => number = (() => {
        if (period === "year") {
            for (let m = 0; m < 12; m++) {
                const month = new Date(start.getFullYear(), start.getMonth() + m, 1);
                series.push({
                    label: month.toLocaleDateString(intlLocale, { month: "long", year: "numeric" }),
                    tick: intlLocale.startsWith("mn")
                        ? String(month.getMonth() + 1)
                        : month.toLocaleDateString(intlLocale, { month: "short" }),
                    income: 0,
                    expense: 0,
                });
            }
            return (d) =>
                (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth();
        }
        const days = period === "week" ? 7 : MONTH_DAYS;
        for (let i = 0; i < days; i++) {
            const day = new Date(start);
            day.setDate(day.getDate() + i);
            series.push({
                label: day.toLocaleDateString(intlLocale, { month: "long", day: "numeric" }),
                tick:
                    period === "week"
                        ? day.toLocaleDateString(intlLocale, { weekday: "short" })
                        : String(day.getDate()),
                income: 0,
                expense: 0,
            });
        }
        return (d) => Math.round((d.getTime() - start.getTime()) / 86_400_000);
    })();

    const byCategory = new Map<Category, number>();
    const expenses: SpendingStats["topExpenses"] = [];
    let spent = 0;
    let earned = 0;
    let count = 0;
    let prevSpent = 0;
    let prevEarned = 0;

    for (const row of rows) {
        const amount = Number(row.amount);
        if (!Number.isFinite(amount)) continue;
        // Parse as local midnight so a row never lands in the wrong bucket.
        const date = new Date(`${row.occurred_at}T00:00:00`);
        const isExpense = row.type === "expense";

        if (date < start) {
            if (isExpense) prevSpent += amount;
            else prevEarned += amount;
            continue;
        }

        count += 1;
        const point = series[pointOf(date)];
        if (!isExpense) {
            earned += amount;
            if (point) point.income += amount;
            continue;
        }

        spent += amount;
        if (point) point.expense += amount;

        const category = toCategory(row.category);
        byCategory.set(category, (byCategory.get(category) ?? 0) + amount);
        expenses.push({
            title: String(row.title),
            amount,
            category,
            occurredAt: String(row.occurred_at),
        });
    }

    return {
        period,
        spent,
        earned,
        count,
        spentChangePercent: changePercent(spent, prevSpent),
        earnedChangePercent: changePercent(earned, prevEarned),
        series,
        byCategory: [...byCategory.entries()]
            .map(([category, amount]) => ({
                category,
                amount,
                percent: spent > 0 ? Math.round((amount / spent) * 100) : 0,
            }))
            .sort((a, b) => b.amount - a.amount),
        topExpenses: expenses.sort((a, b) => b.amount - a.amount).slice(0, 5),
    };
}
