import { TrendingDown, TrendingUp } from "lucide-react";
import { moneyFormatter } from "../functions";
import { getBalanceSummary } from "@/lib/transactions";
import { getT } from "@/lib/i18n/server";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const TotalBalance = async () => {
    const { income, expense, net } = await getBalanceSummary();
    const t = await getT(homeDict);

    // Share of income still unspent. Undefined without income to divide by —
    // "spent 100%" would be wrong for someone who has only logged expenses.
    const savedPercent =
        income > 0 ? Math.round((net / income) * 100) : null;

    return (
        <div className="w-full px-4 pb-4 flex gap-4">
            <div className="flex-1">
                {/* Total balance label */}
                <p className="text-base font-semibold text-muted-foreground tracking-tight mb-2">
                    {t.totalBalance}
                </p>

                {/* Main balance amount */}
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                    {moneyFormatter(net)}
                </h1>

                {/* Change indicator */}
                {savedPercent !== null && (
                    <div className="flex items-center gap-1.5">
                        <span
                            className={
                                net >= 0
                                    ? "text-green-500 text-sm"
                                    : "text-red-500 text-sm"
                            }
                        >
                            {net >= 0 ? "▲" : "▼"}
                        </span>
                        <span
                            className={
                                net >= 0
                                    ? "text-green-500 text-sm font-semibold"
                                    : "text-red-500 text-sm font-semibold"
                            }
                        >
                            {t.percentOfIncome(savedPercent)}
                        </span>
                    </div>
                )}
            </div>

            {/* Income & Expense Cards */}
            <div className="flex flex-col gap-3 rounded-3xl">
                {/* Income Card */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" strokeWidth={2} />
                    <div>
                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            {t.income}
                        </p>
                        <p className="text-base font-bold text-green-600 dark:text-green-500">
                            {moneyFormatter(income)}
                        </p>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="flex items-center gap-2  px-3 py-2 rounded-2xl bg-surface">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500" strokeWidth={2} />
                    <div>
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            {t.expense}
                        </p>
                        <p className="text-base font-bold text-red-600 dark:text-red-500">
                            {moneyFormatter(expense)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
