import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MONTH_DAYS, getSpendingStats, type StatsPeriod } from "@/lib/transactions";
import { moneyFormatter } from "@/components/functions";
import { getLocale, getT } from "@/lib/i18n/server";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { transactionsDict } from "@/lib/i18n/dictionaries/transactions";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { categoryImage } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { TrendCard } from "./_components/TrendCard";
import { CategoryDonut } from "./_components/CategoryDonut";

const PERIODS: StatsPeriod[] = ["week", "month", "year"];

const money = (amount: number) => moneyFormatter(Math.round(amount));

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

const compact = (amount: number) =>
    `₮${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)}`;

// Days covered by each rolling window, for the daily average.
function daysElapsed(period: StatsPeriod) {
    const now = new Date();
    if (period === "week") return 7;
    if (period === "month") return MONTH_DAYS;
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
}

const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
    <section className={cn("rounded-3xl bg-surface p-5", className)}>
        {title && (
            <h2 className="pb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h2>
        )}
        {children}
    </section>
);

export default async function StatsPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const { period: rawPeriod } = await searchParams;
    const period: StatsPeriod = PERIODS.includes(rawPeriod as StatsPeriod)
        ? (rawPeriod as StatsPeriod)
        : "month";

    const locale = await getLocale();
    const [stats, t, categoryLabels] = await Promise.all([
        getSpendingStats(period, INTL_LOCALE[locale]),
        getT(transactionsDict),
        getT(categoriesDict),
    ]);

    const change = (percent: number | null, goodWhenUp: boolean) =>
        percent === null || percent === 0
            ? undefined
            : {
                  text: t.vsPrevious(Math.abs(percent)),
                  up: percent > 0,
                  good: percent > 0 === goodWhenUp,
              };

    return (
        <div className="min-h-screen bg-background pb-28">
            <div className="mx-auto flex max-w-[430px] flex-col gap-4 px-4 pt-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.statistics}</h1>

                {/* Period */}
                <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
                    {PERIODS.map((key) => (
                        <Link
                            key={key}
                            href={`/stats?period=${key}`}
                            replace
                            scroll={false}
                            aria-current={key === period ? "page" : undefined}
                            className={cn(
                                "rounded-xl py-2.5 text-center text-sm font-semibold transition-colors",
                                key === period
                                    ? "bg-background text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.periods[key]}
                        </Link>
                    ))}
                </nav>

                {stats.count === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-12 text-center">
                        <p className="text-base font-semibold text-foreground">{t.noData}</p>
                        <p className="pt-1 text-sm text-muted-foreground">{t.noDataHint}</p>
                    </div>
                ) : (
                    <>
                        {/* Money in and out over the period */}
                        <TrendCard
                            key={period}
                            labels={stats.series.map((point) => capitalize(t.through(point.label)))}
                            ticks={stats.series.map((point) => point.tick)}
                            income={{
                                label: t.income,
                                color: "var(--income)",
                                values: stats.series.map((point) => point.income),
                                change: change(stats.earnedChangePercent, true),
                            }}
                            expense={{
                                label: t.expense,
                                color: "var(--expense)",
                                values: stats.series.map((point) => point.expense),
                                change: change(stats.spentChangePercent, false),
                            }}
                            netLabel={t.net}
                        />

                        {/* Quick figures */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card>
                                <p className="text-sm text-muted-foreground">{t.dailyAverage}</p>
                                <p className="pt-1 text-xl font-bold text-foreground">
                                    {money(stats.spent / daysElapsed(period))}
                                </p>
                            </Card>
                            <Card>
                                <p className="text-sm text-muted-foreground">{t.transactions}</p>
                                <p className="pt-1 text-xl font-bold text-foreground">{stats.count}</p>
                            </Card>
                        </div>

                        {/* Categories */}
                        <Card title={t.byCategory}>
                            {stats.byCategory.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    {t.noExpensesInPeriod}
                                </p>
                            ) : (
                                <>
                                    <CategoryDonut
                                        slices={stats.byCategory}
                                        labels={categoryLabels}
                                        centerValue={compact(stats.spent)}
                                        centerLabel={t.spent}
                                    />
                                    <div className="grid grid-cols-2 gap-2.5 pt-6">
                                        {stats.byCategory.map((slice) => (
                                            <div key={slice.category} className="flex flex-col gap-2 rounded-2xl bg-background p-3">
                                                <div className="flex items-start justify-between">
                                                    <Image
                                                        src={categoryImage(slice.category)}
                                                        alt=""
                                                        width={36}
                                                        height={36}
                                                        className="size-9 object-contain"
                                                    />
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {slice.percent}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-foreground">{money(slice.amount)}</p>
                                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <span
                                                            className="size-2 shrink-0 rounded-full"
                                                            style={{ background: `var(--cat-${slice.category})` }}
                                                        />
                                                        <span className="truncate">{categoryLabels[slice.category]}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* Biggest expenses */}
                        {stats.topExpenses.length > 0 && (
                            <Card title={t.topExpenses}>
                                <div className="flex flex-col gap-3">
                                    {stats.topExpenses.map((item, index) => (
                                        <div key={`${item.title}-${index}`} className="flex items-center gap-3">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
                                                <Image
                                                    src={categoryImage(item.category)}
                                                    alt=""
                                                    width={28}
                                                    height={28}
                                                    className="size-7 object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {categoryLabels[item.category]} ·{" "}
                                                    {new Date(`${item.occurredAt}T00:00:00`).toLocaleDateString(
                                                        INTL_LOCALE[locale],
                                                        { month: "short", day: "numeric" }
                                                    )}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{money(item.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    );
}
