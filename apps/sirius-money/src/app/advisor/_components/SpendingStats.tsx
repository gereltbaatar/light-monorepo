import Image from "next/image";
import { moneyFormatter } from "@/components/functions";
import { categoryImage } from "@/lib/categories";
import type { SpendingSummary } from "@/lib/spending-summary";
import { getT } from "@/lib/i18n/server";
import { advisorDict } from "@/lib/i18n/dictionaries/advisor";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";

export const SpendingStats = async ({ summary }: { summary: SpendingSummary }) => {
    const [t, categories] = await Promise.all([getT(advisorDict), getT(categoriesDict)]);
    const top = summary.byCategory[0];
    const change = summary.changePercent;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-surface p-4">
                    <p className="text-sm text-muted-foreground">{t.thisMonth}</p>
                    <p className="pt-1 text-2xl font-bold text-foreground tabular-nums">
                        {moneyFormatter(summary.monthSpent)}
                    </p>
                    {change !== null && (
                        <p
                            className={`pt-0.5 text-xs font-semibold ${change > 0 ? "text-red-500" : "text-green-600 dark:text-green-500"}`}
                        >
                            {change > 0 ? "▲" : "▼"} {t.vsLastMonth(Math.abs(change))}
                        </p>
                    )}
                </div>

                <div className="rounded-3xl bg-surface p-4">
                    <p className="text-sm text-muted-foreground">{t.topCategory}</p>
                    {top ? (
                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
                                <Image
                                    src={categoryImage(top.category)}
                                    alt={categories[top.category]}
                                    width={22}
                                    height={22}
                                    className="h-[22px] w-[22px] object-contain"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-base font-bold text-foreground">{categories[top.category]}</p>
                                <p className="text-xs text-muted-foreground">{t.shareOfSpending(top.share)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="pt-1 text-sm text-muted-foreground">{t.noExpenses}</p>
                    )}
                </div>
            </div>

            {summary.byCategory.length > 0 && (
                <div className="rounded-3xl bg-surface p-4">
                    <p className="pb-3 text-sm text-muted-foreground">{t.whereMoneyGoes}</p>
                    <div className="space-y-3">
                        {summary.byCategory.slice(0, 5).map((c) => (
                            <div key={c.category} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-foreground">{categories[c.category]}</span>
                                    <span className="tabular-nums text-muted-foreground">
                                        {moneyFormatter(c.amount)} · {c.share}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                                    <div
                                        className="h-full rounded-full bg-foreground"
                                        style={{ width: `${Math.max(c.share, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {summary.topMerchants.length > 0 && (
                <div className="rounded-3xl bg-surface p-4">
                    <p className="pb-2 text-sm text-muted-foreground">{t.topPlaces}</p>
                    <div className="divide-y divide-border">
                        {summary.topMerchants.map((m) => (
                            <div key={m.title} className="flex items-center justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t.visits(m.count)}
                                    </p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold tabular-nums text-red-500">
                                    -{moneyFormatter(m.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
