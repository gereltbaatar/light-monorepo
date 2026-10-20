"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import type { Budget } from "@/lib/budgets";
import { CATEGORIES } from "@/lib/categories";
import { DATE_LOCALE } from "@/lib/date-locale";
import { useLocale, useT } from "@/lib/i18n/client";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { homeDict } from "@/lib/i18n/dictionaries/home";
import { SUBSCRIPTION_ICONS, logoColorOn } from "@/lib/subscription-icons";
import { moneyFormatter } from "../functions";

const ringColor = (budget: Budget) => {
    if (budget.kind !== "limit") return "var(--foreground)";
    if (budget.percent >= 100) return "var(--destructive)";
    if (budget.warning_percent !== null && budget.percent >= budget.warning_percent) {
        return "var(--accent-orange)";
    }
    return "var(--foreground)";
};

export const BudgetCard = ({ budget }: { budget: Budget }) => {
    const t = useT(homeDict);
    const categories = useT(categoriesDict);
    const locale = useLocale();
    const brand = budget.icon ? SUBSCRIPTION_ICONS[budget.icon] : null;
    const CategoryIcon = budget.category ? CATEGORIES[budget.category].icon : undefined;
    const title = budget.title ?? (budget.category ? categories[budget.category] : "");
    const subtitle =
        budget.kind === "limit"
            ? `${moneyFormatter(budget.spent ?? 0)} / ${moneyFormatter(budget.amount_mnt)}`
            : budget.next_due &&
              format(new Date(`${budget.next_due}T00:00:00`), "MMM d", {
                  locale: DATE_LOCALE[locale],
              });

    return (
        <Link href={`/budgets/${budget.id}`} className="shrink-0">
            <div className="h-[220px] w-[155px] bg-surface rounded-3xl">
                <div className="w-full h-full px-3 py-3 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold text-foreground tracking-tight">
                            {t.budget}
                        </p>
                    </div>

                    <div className="w-24 h-24 mx-auto mb-3">
                        <CircularProgressbarWithChildren
                            value={Math.max(0, Math.min(100, budget.percent))}
                            strokeWidth={8}
                            styles={buildStyles({
                                pathColor: ringColor(budget),
                                trailColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
                                strokeLinecap: "round",
                            })}
                        >
                            {brand || CategoryIcon ? (
                                <div className="relative size-[68px]">
                                    <div
                                        className="flex size-full items-center justify-center rounded-full bg-surface-2 text-foreground ring-1 ring-border"
                                        style={
                                            brand
                                                ? { backgroundColor: `#${brand.hex}`, color: logoColorOn(brand.hex) }
                                                : undefined
                                        }
                                    >
                                        {budget.icon ? (
                                            <SubscriptionIcon id={budget.icon} className="h-8 w-8" />
                                        ) : (
                                            CategoryIcon && <CategoryIcon className="h-8 w-8" />
                                        )}
                                    </div>
                                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-px text-[10px] font-bold text-background">
                                        {budget.percent}%
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[26px] text-foreground">{budget.percent}%</span>
                            )}
                        </CircularProgressbarWithChildren>
                    </div>

                    <div className="text-center mt-auto">
                        <p className="truncate text-sm font-semibold text-foreground mb-0.5">{title}</p>
                        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
