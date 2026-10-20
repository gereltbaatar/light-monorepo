import Link from "next/link";
import { HandCoins } from "lucide-react";
import { Progress } from "@workspace/ui/components/progress";
import { moneyFormatter } from "@/components/functions";
import { getLoans, type Loan } from "@/lib/loans";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { loansDict } from "@/lib/i18n/dictionaries/loans";

export const loanPercent = (loan: Pick<Loan, "paid_amount" | "total_amount">) =>
    loan.total_amount > 0
        ? Math.max(0, Math.min(100, Math.round((loan.paid_amount / loan.total_amount) * 100)))
        : 0;

const formatShortDate = (value: string, locale: Locale) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(INTL_LOCALE[locale], {
        month: "short",
        day: "numeric",
    });

export const Loans = async () => {
    const [loans, locale] = await Promise.all([getLoans(), getLocale()]);
    const t = loansDict[locale];

    return (
        <div className="px-4 pb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                <Link
                    href="/loans/new"
                    className="text-foreground font-medium hover:text-foreground/80 transition-colors"
                >
                    {t.add}
                </Link>
            </div>

            {loans.length === 0 ? (
                <Link
                    href="/loans/new"
                    className="block rounded-2xl border border-dashed border-border px-6 py-8 text-center"
                >
                    <p className="text-base font-semibold text-foreground">{t.emptyTitle}</p>
                    <p className="pt-1 text-sm text-muted-foreground">{t.emptyHint}</p>
                </Link>
            ) : (
                <div className="space-y-3">
                    {loans.map((loan) => {
                        const percent = loanPercent(loan);
                        return (
                            <Link
                                key={loan.id}
                                href={`/loans/${loan.id}`}
                                className="block rounded-3xl bg-surface p-4 dark:border dark:border-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background">
                                        <HandCoins className="size-5 text-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-base font-bold tracking-tight text-foreground">
                                            {loan.lender}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {loan.next_due_date
                                                ? `${t.nextPayment} · ${formatShortDate(loan.next_due_date, locale)}`
                                                : t.fullyRepaid}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-xl font-bold text-foreground">{percent}%</p>
                                </div>

                                <div className="space-y-1.5 pt-3">
                                    <Progress value={percent} className="h-1.5 bg-foreground/10" />
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                        <span>
                                            {moneyFormatter(loan.paid_amount)} / {moneyFormatter(loan.total_amount)}
                                        </span>
                                        <span>{t.paidCount(loan.paid_count, loan.installment_count)}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
