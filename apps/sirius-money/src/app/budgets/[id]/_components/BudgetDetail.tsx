"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { deleteBudget } from "@/app/_actions/budgets";
import { moneyFormatter } from "@/components/functions";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import type { Budget, BudgetExpense } from "@/lib/budgets";
import { CATEGORIES } from "@/lib/categories";
import { DATE_LOCALE } from "@/lib/date-locale";
import { formatAmount } from "@/lib/format-amount";
import { useLocale, useT } from "@/lib/i18n/client";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { SUBSCRIPTION_ICONS, logoColorOn } from "@/lib/subscription-icons";

const parseDay = (value: string) => new Date(`${value}T00:00:00`);

const indicatorColor = (budget: Budget) => {
    if (budget.kind !== "limit") return "[&>div]:bg-foreground";
    if (budget.percent >= 100) return "[&>div]:bg-destructive";
    if (budget.warning_percent !== null && budget.percent >= budget.warning_percent) {
        return "[&>div]:bg-accent-orange";
    }
    return "[&>div]:bg-foreground";
};

export const BudgetDetail = ({
    budget,
    expenses,
}: {
    budget: Budget;
    expenses: BudgetExpense[];
}) => {
    const t = useT(budgetsDict);
    const categories = useT(categoriesDict);
    const locale = useLocale();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const d = t.detail;
    const isLimit = budget.kind === "limit";
    const formatDay = (value: string) =>
        format(parseDay(value), "PP", { locale: DATE_LOCALE[locale] });
    const brand = budget.icon ? SUBSCRIPTION_ICONS[budget.icon] : null;
    const CategoryIcon = budget.category ? CATEGORIES[budget.category].icon : undefined;
    const title = budget.title ?? (budget.category ? categories[budget.category] : "");
    const foreignAmount =
        budget.currency === "MNT" ? null : `${formatAmount(String(budget.amount))} ${budget.currency}`;

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteBudget(budget.id);
        if ("error" in result) {
            toast.error(result.error);
            setIsDeleting(false);
            return;
        }
        toast.success(d.deleted);
        router.replace("/");
        router.refresh();
    };

    return (
        <>
            <div
                className="relative h-[240px] w-full bg-surface-2"
                style={brand ? { backgroundColor: `#${brand.hex}`, color: logoColorOn(brand.hex) } : undefined}
            >
                <div className="flex h-full w-full items-center justify-center pb-10">
                    {budget.icon ? (
                        <SubscriptionIcon id={budget.icon} className="h-20 w-20" />
                    ) : (
                        CategoryIcon && <CategoryIcon className="h-16 w-16 text-muted-foreground" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => router.back()}
                    className="absolute left-4 top-4 h-10 w-10 rounded-full bg-white/90 text-black hover:bg-white"
                    aria-label={t.back}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-2 pb-1">
                        <Badge variant="secondary">{isLimit ? t.limit : t.recurring}</Badge>
                        <Badge variant="secondary">{t.periodOptions[budget.period]}</Badge>
                    </div>
                    <h1 className="truncate text-3xl font-bold tracking-tight">{title}</h1>
                </div>
            </div>

            <div className="px-4 pt-5 space-y-5">
                <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                    <CardContent className="p-5 space-y-3">
                        {isLimit ? (
                            <LimitSummary budget={budget} formatDay={formatDay} />
                        ) : (
                            <RecurringSummary
                                budget={budget}
                                foreignAmount={foreignAmount}
                                formatDay={formatDay}
                            />
                        )}
                        <Progress
                            value={Math.max(0, Math.min(100, budget.percent))}
                            className={`h-2.5 bg-foreground/10 ${indicatorColor(budget)}`}
                        />
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                    <CardContent className="p-0">
                        {isLimit ? (
                            <>
                                <InfoRow label={t.limitAmount} value={foreignAmount ?? moneyFormatter(budget.amount_mnt)} />
                                <Separator />
                                <InfoRow label={t.warnAt} value={`${budget.warning_percent ?? 100}%`} />
                            </>
                        ) : (
                            <>
                                {budget.due_date && (
                                    <>
                                        <InfoRow label={t.dueDate} value={formatDay(budget.due_date)} />
                                        <Separator />
                                    </>
                                )}
                                <InfoRow
                                    label={t.reminders}
                                    value={
                                        budget.remind_days_before > 0
                                            ? t.remindDaysBefore(budget.remind_days_before)
                                            : t.noReminder
                                    }
                                />
                                <Separator />
                                <InfoRow label={t.autoRepeat} value={budget.auto_repeat ? d.yes : d.no} />
                                <Separator />
                                <InfoRow
                                    label={d.doTask}
                                    value={
                                        budget.create_tasks && budget.next_due
                                            ? `${d.yes} · ${formatDay(budget.next_due)}`
                                            : d.no
                                    }
                                />
                            </>
                        )}
                        <Separator />
                        <InfoRow label={d.createdOn} value={formatDay(budget.created_at.slice(0, 10))} />
                    </CardContent>
                </Card>

                {isLimit && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{d.expenses}</p>
                        {expenses.length === 0 ? (
                            <p className="rounded-3xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
                                {d.noExpenses}
                            </p>
                        ) : (
                            <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                                <CardContent className="p-0">
                                    {expenses.map((expense, index) => (
                                        <div key={expense.id}>
                                            {index > 0 && <Separator />}
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/transactions/${expense.id}`)}
                                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {expense.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDay(expense.occurred_at)}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-sm font-bold text-expense">
                                                    - {moneyFormatter(expense.amount)}
                                                </p>
                                            </button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-12 w-full rounded-full bg-expense-soft text-expense hover:bg-expense-soft/80 hover:text-expense"
                        >
                            <Trash2 className="h-4 w-4" /> {d.deleteBudget}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[360px] rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{d.deleteConfirmTitle(title)}</AlertDialogTitle>
                            <AlertDialogDescription>{d.deleteConfirmBody}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">{d.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-full bg-expense text-white hover:bg-expense/90"
                            >
                                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {d.delete}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

const LimitSummary = ({
    budget,
    formatDay,
}: {
    budget: Budget;
    formatDay: (value: string) => string;
}) => {
    const d = useT(budgetsDict).detail;
    const spent = budget.spent ?? 0;
    const remaining = budget.amount_mnt - spent;

    return (
        <>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{d.spent}</p>
                    <p className="text-3xl font-bold text-foreground">{moneyFormatter(spent)}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{budget.percent}%</p>
            </div>
            <div className="flex justify-between gap-3 text-sm text-muted-foreground">
                <span>{d.limitOf(moneyFormatter(budget.amount_mnt))}</span>
                <span className={remaining < 0 ? "text-destructive" : undefined}>
                    {remaining < 0
                        ? d.over(moneyFormatter(-remaining))
                        : d.left(moneyFormatter(remaining))}
                </span>
            </div>
            {budget.period_start && (
                <p className="text-xs text-muted-foreground">{d.since(formatDay(budget.period_start))}</p>
            )}
        </>
    );
};

const RecurringSummary = ({
    budget,
    foreignAmount,
    formatDay,
}: {
    budget: Budget;
    foreignAmount: string | null;
    formatDay: (value: string) => string;
}) => {
    const t = useT(budgetsDict);
    const d = t.detail;
    const daysLeft = budget.next_due
        ? differenceInCalendarDays(parseDay(budget.next_due), new Date())
        : null;

    return (
        <>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{d.payment}</p>
                    <p className="truncate text-3xl font-bold text-foreground">
                        {foreignAmount ?? moneyFormatter(budget.amount_mnt)}
                    </p>
                    {foreignAmount && (
                        <p className="text-xs text-muted-foreground">
                            {t.approxMnt(formatAmount(String(budget.amount_mnt)))}
                        </p>
                    )}
                </div>
                {daysLeft !== null && (
                    <p className="shrink-0 text-right text-sm font-semibold text-foreground">
                        {daysLeft <= 0 ? d.dueToday : d.daysLeft(daysLeft)}
                    </p>
                )}
            </div>
            {budget.next_due && (
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{d.nextDue}</span>
                    <span>{formatDay(budget.next_due)}</span>
                </div>
            )}
        </>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
);
