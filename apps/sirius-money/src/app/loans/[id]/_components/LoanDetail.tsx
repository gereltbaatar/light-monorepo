"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
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
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { moneyFormatter } from "@/components/functions";
import { attachLoanContract, deleteLoan, setLoanPaymentPaid } from "@/app/_actions/loans";
import type { Loan, LoanPayment } from "@/lib/loans";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { loansDict } from "@/lib/i18n/dictionaries/loans";
import { cn } from "@/lib/utils";

const formatDate = (value: string, locale: Locale) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(INTL_LOCALE[locale], {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

const daysBetween = (from: string, to: string) =>
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const localToday = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

export const LoanDetail = ({
    loan,
    payments,
    contractUrl,
}: {
    loan: Loan;
    payments: LoanPayment[];
    contractUrl: string | null;
}) => {
    const t = useT(loansDict);
    const locale = useLocale();
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAttaching, setIsAttaching] = useState(false);

    const percent =
        loan.total_amount > 0 ? Math.min(100, Math.round((loan.paid_amount / loan.total_amount) * 100)) : 0;
    const remaining = Math.max(0, loan.total_amount - loan.paid_amount);
    const today = localToday();
    const nextPayment = payments.find((p) => !p.paid_at);
    const daysToNext = nextPayment ? daysBetween(today, nextPayment.due_date) : 0;

    const contractInterest = payments.every((p) => p.interest_part != null)
        ? payments.reduce((sum, p) => sum + (p.interest_part ?? 0), 0)
        : null;
    const interest = contractInterest ?? Math.max(0, loan.total_amount - loan.principal);

    const amounts = payments.map((p) => p.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const perPayment =
        amounts.length === 0
            ? null
            : minAmount === maxAmount
              ? moneyFormatter(minAmount)
              : `${moneyFormatter(minAmount)} – ${moneyFormatter(maxAmount)}`;

    const paymentDay = (() => {
        const first = payments[0]?.due_date;
        if (!first) return null;
        const date = new Date(`${first}T00:00:00`);
        if (loan.period === "weekly") {
            return t.everyWeekday(date.toLocaleDateString(INTL_LOCALE[locale], { weekday: "long" }));
        }
        if (loan.period === "yearly") {
            return date.toLocaleDateString(INTL_LOCALE[locale], { month: "long", day: "numeric" });
        }
        if (loan.period === "once") return formatDate(first, locale);
        const sample = payments.slice(0, loan.period === "semimonthly" ? 2 : 1);
        const days = [...new Set(sample.map((p) => Number(p.due_date.slice(8, 10))))].sort((a, b) => a - b);
        return t.monthDays(days.join(", "));
    })();
    const lastDueDate = loan.maturity_date ?? payments.at(-1)?.due_date ?? null;

    const handleAttach = async (file: File | undefined) => {
        if (!file) return;
        setIsAttaching(true);
        try {
            const form = new FormData();
            form.append("contract", file);
            const result = await attachLoanContract(loan.id, form);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(t.contractAttached);
            router.refresh();
        } finally {
            setIsAttaching(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const togglePaid = async (payment: LoanPayment, paid: boolean) => {
        setPendingId(payment.id);
        try {
            const result = await setLoanPaymentPaid(payment.id, paid, localToday());
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            router.refresh();
            if (paid) {
                toast.success(t.paymentMarked, {
                    description: `${t.installment(payment.seq, loan.installment_count)} · ${moneyFormatter(payment.amount)}`,
                    action: { label: t.undo, onClick: () => void togglePaid(payment, false) },
                });
            } else {
                toast.success(t.paymentUndone);
            }
        } finally {
            setPendingId(null);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteLoan(loan.id);
        if ("error" in result) {
            toast.error(result.error);
            setIsDeleting(false);
            return;
        }
        toast.success(t.loanDeleted);
        router.replace("/");
        router.refresh();
    };

    return (
        <>
            <div className="sticky top-0 z-40 flex items-center justify-center bg-background px-4 py-4">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="absolute left-4 h-10 w-10 rounded-full"
                    aria-label={t.back}
                >
                    <ChevronLeft className="h-7 w-7 text-foreground" />
                </Button>
                <div className="max-w-[70%] text-center">
                    <h1 className="truncate text-2xl font-bold text-foreground tracking-tight">{loan.lender}</h1>
                    {loan.loan_type && (
                        <p className="truncate text-xs text-muted-foreground">{loan.loan_type}</p>
                    )}
                </div>
            </div>

            <div className="px-4 space-y-5">
                <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t.paid}</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {moneyFormatter(loan.paid_amount)}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{percent}%</p>
                        </div>
                        <Progress value={percent} className="h-2.5 bg-foreground/10" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t.paidCount(loan.paid_count, loan.installment_count)}</span>
                            <span>{t.remaining(moneyFormatter(remaining))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{t.nextPayment}</p>
                                <p className="truncate text-base font-bold text-foreground">
                                    {nextPayment
                                        ? `${formatDate(nextPayment.due_date, locale)} · ${moneyFormatter(nextPayment.amount)}`
                                        : t.fullyRepaid}
                                </p>
                            </div>
                            {nextPayment && (
                                <span
                                    className={cn(
                                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                                        daysToNext < 0
                                            ? "bg-expense-soft text-expense"
                                            : "bg-foreground/5 text-foreground"
                                    )}
                                >
                                    {daysToNext < 0
                                        ? t.daysOverdue(-daysToNext)
                                        : daysToNext === 0
                                          ? t.dueToday
                                          : t.daysLeft(daysToNext)}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Section title={t.overview}>
                    <InfoRow label={t.borrowed} value={moneyFormatter(loan.principal)} />
                    <InfoRow label={t.totalToRepay} value={moneyFormatter(loan.total_amount)} />
                    <InfoRow label={t.totalInterest} value={moneyFormatter(interest)} />
                    {loan.interest_rate != null && (
                        <InfoRow
                            label={t.interestRate}
                            value={t.rateValue(String(loan.interest_rate), loan.interest_rate_unit ?? "monthly")}
                        />
                    )}
                    {loan.fees != null && <InfoRow label={t.fees} value={moneyFormatter(loan.fees)} />}
                </Section>

                <Section title={t.payments}>
                    <InfoRow label={t.period} value={t.frequency[loan.period]} />
                    {paymentDay && <InfoRow label={t.paymentDay} value={paymentDay} />}
                    {perPayment && (
                        <InfoRow
                            label={t.perPayment}
                            value={`${perPayment} · ${t.paymentsCount(loan.installment_count)}`}
                        />
                    )}
                    <InfoRow label={t.firstDueDate} value={formatDate(loan.first_due_date, locale)} />
                    {lastDueDate && <InfoRow label={t.lastPayment} value={formatDate(lastDueDate, locale)} />}
                </Section>

                <Section title={t.contract}>
                    {loan.contract_number && <InfoRow label={t.contractNumber} value={loan.contract_number} />}
                    {loan.contract_date && (
                        <InfoRow label={t.contractDate} value={formatDate(loan.contract_date, locale)} />
                    )}
                    <div className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background">
                                <FileText className="size-4 text-foreground" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">{t.contractFile}</p>
                                {!loan.contract_path && (
                                    <p className="text-xs text-muted-foreground/70">{t.noContract}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {contractUrl && (
                                <a
                                    href={contractUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
                                >
                                    <ExternalLink className="size-3.5" />
                                    {t.viewContract}
                                </a>
                            )}
                            <button
                                type="button"
                                disabled={isAttaching}
                                onClick={() => fileInput.current?.click()}
                                className={cn(
                                    "flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold disabled:opacity-50",
                                    contractUrl
                                        ? "bg-background text-foreground"
                                        : "bg-primary text-primary-foreground"
                                )}
                            >
                                {isAttaching ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    !contractUrl && <Upload className="size-3.5" />
                                )}
                                {loan.contract_path ? t.replaceContract : t.attachContract}
                            </button>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => void handleAttach(e.target.files?.[0])}
                            />
                        </div>
                    </div>
                </Section>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t.schedule}</p>
                    <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
                        <CardContent className="p-0">
                            {payments.map((payment, index) => {
                                const overdue = !payment.paid_at && payment.due_date < today;
                                const pending = pendingId === payment.id;
                                return (
                                    <div key={payment.id}>
                                        {index > 0 && <Separator />}
                                        <div className="flex items-center justify-between gap-3 px-5 py-4">
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        "truncate text-sm font-semibold",
                                                        payment.paid_at ? "text-muted-foreground" : "text-foreground"
                                                    )}
                                                >
                                                    {t.installment(payment.seq, loan.installment_count)}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-xs",
                                                        overdue ? "font-semibold text-expense" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {formatDate(payment.due_date, locale)}
                                                    {overdue && ` · ${t.overdue}`}
                                                </p>
                                                {payment.principal_part != null && payment.interest_part != null && (
                                                    <p className="text-[11px] text-muted-foreground/80">
                                                        {t.principalShort} {moneyFormatter(payment.principal_part)} ·{" "}
                                                        {t.interestShort} {moneyFormatter(payment.interest_part)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 items-center gap-3">
                                                <p
                                                    className={cn(
                                                        "text-sm font-bold",
                                                        payment.paid_at ? "text-muted-foreground line-through" : "text-foreground"
                                                    )}
                                                >
                                                    {moneyFormatter(payment.amount)}
                                                </p>
                                                {payment.paid_at ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => void togglePaid(payment, false)}
                                                        disabled={pending}
                                                        aria-label={t.undo}
                                                        className="flex size-9 items-center justify-center rounded-full bg-success text-white disabled:opacity-50"
                                                    >
                                                        {pending ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Check className="size-4" strokeWidth={3} />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => void togglePaid(payment, true)}
                                                        disabled={pending}
                                                        className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                                                    >
                                                        {pending && <Loader2 className="size-3.5 animate-spin" />}
                                                        {t.markPaid}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-12 w-full rounded-full bg-expense-soft text-expense hover:bg-expense-soft/80 hover:text-expense"
                        >
                            <Trash2 className="h-4 w-4" /> {t.deleteLoan}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[360px] rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirmTitle(loan.lender)}</AlertDialogTitle>
                            <AlertDialogDescription>{t.deleteConfirmBody}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-full bg-expense text-white hover:bg-expense/90"
                            >
                                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t.delete}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Card className="rounded-3xl border border-transparent bg-surface shadow-none dark:border-border">
            <CardContent className="divide-y divide-border p-0">{children}</CardContent>
        </Card>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
);
