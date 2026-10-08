import { CATEGORIES, type Category } from "@/lib/categories";
import type { Transaction } from "@/lib/transactions";

export interface CategorySpend {
    category: Category;
    label: string;
    amount: number;
    share: number;
    count: number;
}

export interface MerchantSpend {
    title: string;
    amount: number;
    count: number;
}

export interface SpendingSummary {
    monthSpent: number;
    lastMonthSpent: number;
    /** Null when last month had no spending to compare against. */
    changePercent: number | null;
    monthIncome: number;
    /** Last 30 days, largest first. */
    byCategory: CategorySpend[];
    topMerchants: MerchantSpend[];
    biggest: { title: string; amount: number; date: string } | null;
    avgPerDay: number;
    txCount: number;
}

const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function buildSpendingSummary(transactions: Transaction[]): SpendingSummary {
    const now = new Date();
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - 29);

    let monthSpent = 0;
    let lastMonthSpent = 0;
    let monthIncome = 0;
    let windowSpent = 0;
    let txCount = 0;
    let biggest: SpendingSummary["biggest"] = null;
    const categories = new Map<Category, { amount: number; count: number }>();
    const merchants = new Map<string, MerchantSpend>();

    for (const tx of transactions) {
        // Local midnight so a row never lands in the wrong month.
        const date = new Date(`${tx.occurred_at}T00:00:00`);
        const key = monthKey(date);

        if (tx.type === "income") {
            if (key === thisMonth) monthIncome += tx.amount;
            continue;
        }

        if (key === thisMonth) monthSpent += tx.amount;
        if (key === lastMonth) lastMonthSpent += tx.amount;
        if (date < windowStart) continue;

        windowSpent += tx.amount;
        txCount += 1;

        const cat = categories.get(tx.category) ?? { amount: 0, count: 0 };
        cat.amount += tx.amount;
        cat.count += 1;
        categories.set(tx.category, cat);

        const name = tx.title.trim();
        const merchantKey = name.toLowerCase();
        const merchant = merchants.get(merchantKey) ?? { title: name, amount: 0, count: 0 };
        merchant.amount += tx.amount;
        merchant.count += 1;
        merchants.set(merchantKey, merchant);

        if (!biggest || tx.amount > biggest.amount) {
            biggest = { title: name, amount: tx.amount, date: tx.occurred_at };
        }
    }

    const byCategory = [...categories.entries()]
        .map(([category, { amount, count }]) => ({
            category,
            label: CATEGORIES[category].label,
            amount,
            count,
            share: windowSpent > 0 ? Math.round((amount / windowSpent) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    const topMerchants = [...merchants.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return {
        monthSpent,
        lastMonthSpent,
        changePercent:
            lastMonthSpent > 0
                ? Math.round(((monthSpent - lastMonthSpent) / lastMonthSpent) * 100)
                : null,
        monthIncome,
        byCategory,
        topMerchants,
        biggest,
        avgPerDay: Math.round(windowSpent / 30),
        txCount,
    };
}
