import "server-only";

import { createClient } from "../supabase/server";
import { ratio } from "../lib/format";
import type { DayRange } from "../lib/date";
import type { MoneyTransaction } from "../lib/types";

// Mirrors CATEGORIES in sirius-money's src/lib/categories.ts.
const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  coffee: "Coffee",
  shopping: "Shopping",
  taxi: "Taxi",
  entertainment: "Entertainment",
  bills: "Bills",
  health: "Health",
  salary: "Salary",
  gift: "Gift",
  other: "Other",
};

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key;
}

export async function getTransactions(range: DayRange, limit = 1000): Promise<MoneyTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ex_transactions")
    .select("id, type, amount, title, occurred_at, category")
    .gte("occurred_at", range.start)
    .lte("occurred_at", range.end)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  // numeric(14,2) arrives as a string from PostgREST.
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as MoneyTransaction[];
}

// All-time income minus expense, as sirius-money's TotalBalance shows it.
export async function getTotalBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("ex_transactions").select("type, amount");

  return (data ?? []).reduce(
    (sum, row) => sum + (row.type === "income" ? Number(row.amount) : -Number(row.amount)),
    0
  );
}

export interface CategorySpend {
  key: string;
  name: string;
  amount: number;
  share: number;
}

export interface MoneySummary {
  income: number;
  expense: number;
  left: number;
  savingsRate: number | null;
  topCategories: CategorySpend[];
  balance: number;
}

export async function getMoneySummary(month: DayRange): Promise<MoneySummary> {
  const [transactions, balance] = await Promise.all([getTransactions(month), getTotalBalance()]);

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === "income") {
      income += tx.amount;
      continue;
    }
    expense += tx.amount;
    byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount);
  }

  const topCategories = [...byCategory]
    .map(([key, amount]) => ({ key, name: categoryLabel(key), amount, share: expense > 0 ? amount / expense : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return {
    income,
    expense,
    left: income - expense,
    savingsRate: ratio(income - expense, income),
    topCategories,
    balance,
  };
}
