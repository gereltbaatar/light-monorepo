"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronLeft, FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { moneyFormatter } from "@/components/functions";
import { createLoan, discardLoanContract } from "@/app/_actions/loans";
import { parseLoanContract } from "@/app/_actions/parse-loan-contract";
import {
    LOAN_PERIODS,
    isLoanPeriod,
    type InterestRateUnit,
    type LoanPeriod,
    type ScheduleRow,
} from "@/lib/loan-contract";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { loansDict } from "@/lib/i18n/dictionaries/loans";
import { cn } from "@/lib/utils";

const inputClass =
    "h-12 px-4 rounded-2xl bg-surface text-foreground placeholder:text-muted-foreground/70 border-border";
const selectClass =
    "h-12 w-full px-4 rounded-2xl bg-surface text-foreground border border-border outline-none";
const labelClass = "text-sm text-muted-foreground";

const numberText = (value?: number) => (value ? String(value) : "");

export const NewLoanForm = () => {
    const t = useT(loansDict);
    const locale = useLocale();
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);

    const [lender, setLender] = useState("");
    const [principal, setPrincipal] = useState("");
    const [installmentAmount, setInstallmentAmount] = useState("");
    const [installmentCount, setInstallmentCount] = useState("");
    const [period, setPeriod] = useState<LoanPeriod>("monthly");
    const [firstDueDate, setFirstDueDate] = useState("");
    const [schedule, setSchedule] = useState<ScheduleRow[]>([]);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [loanType, setLoanType] = useState("");
    const [contractNumber, setContractNumber] = useState("");
    const [contractDate, setContractDate] = useState("");
    const [maturityDate, setMaturityDate] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [rateUnit, setRateUnit] = useState<InterestRateUnit>("monthly");
    const [fees, setFees] = useState("");

    const [contract, setContract] = useState<{ path: string; fileName: string } | null>(null);
    const [needsCheck, setNeedsCheck] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const count = period === "once" ? 1 : Number(installmentCount);
    const total = schedule.length
        ? schedule.reduce((sum, row) => sum + row.amount, 0)
        : Number(installmentAmount) * count;
    const interest = total - Number(principal);
    const showSummary = total > 0 && Number(principal) > 0;

    const formatDate = (value: string) =>
        new Date(`${value}T00:00:00`).toLocaleDateString(INTL_LOCALE[locale], {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setIsReading(true);
        try {
            const form = new FormData();
            form.append("contract", file);
            const result = await parseLoanContract(form);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            if (contract) void discardLoanContract(contract.path);
            setContract({ path: result.path, fileName: result.fileName });

            const read = result.contract;
            if (!read) {
                setNeedsCheck(false);
                if (result.warning) toast.warning(result.warning);
                return;
            }
            if (read.lender) setLender(read.lender);
            if (read.principal) setPrincipal(String(read.principal));
            setPeriod(read.period);
            setSchedule(read.schedule);
            setLoanType(read.loanType ?? "");
            setContractNumber(read.contractNumber ?? "");
            setContractDate(read.contractDate ?? "");
            setMaturityDate(read.maturityDate ?? "");
            setInterestRate(numberText(read.interestRate));
            setRateUnit(read.interestRateUnit ?? "monthly");
            setFees(numberText(read.fees));
            setDetailsOpen(true);
            setNeedsCheck(!read.confident);
            toast.success(t.contractRead);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t.contractErrors.uploadFailed);
        } finally {
            setIsReading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const removeContract = () => {
        if (contract) void discardLoanContract(contract.path);
        setContract(null);
        setSchedule([]);
        setNeedsCheck(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        try {
            const result = await createLoan({
                lender,
                principal: Number(principal),
                installmentAmount: Number(installmentAmount),
                installmentCount: count,
                period,
                firstDueDate,
                schedule,
                contractPath: contract?.path,
                details: {
                    loanType,
                    contractNumber,
                    contractDate,
                    maturityDate,
                    interestRate: interestRate ? Number(interestRate) : undefined,
                    interestRateUnit: rateUnit,
                    fees: Number(fees) || undefined,
                },
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(t.loanCreated);
            router.replace(result.id ? `/loans/${result.id}` : "/");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t.errors.createFailed);
        } finally {
            setIsSaving(false);
        }
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
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.newLoan}</h1>
            </div>

            <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
                <input
                    ref={fileInput}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => void handleFile(e.target.files?.[0])}
                />

                {contract && !isReading ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 dark:border dark:border-border">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-expense-soft">
                                <FileText className="size-5 text-expense" />
                            </div>
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                                {contract.fileName}
                            </p>
                            <button
                                type="button"
                                onClick={removeContract}
                                aria-label={t.removeFile}
                                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        {needsCheck && (
                            <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-xs text-foreground">
                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                                {t.checkValues}
                            </p>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={isReading}
                        onClick={() => fileInput.current?.click()}
                        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-4 text-left transition-colors hover:bg-surface disabled:opacity-70"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
                            {isReading ? (
                                <Loader2 className="size-5 animate-spin text-foreground" />
                            ) : (
                                <Upload className="size-5 text-foreground" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                                {isReading ? t.readingContract : t.uploadContract}
                            </p>
                            <p className="text-xs text-muted-foreground">{t.uploadHint}</p>
                        </div>
                    </button>
                )}

                <div className="space-y-2">
                    <Label htmlFor="loan_lender" className={labelClass}>
                        {t.lender}
                    </Label>
                    <Input
                        id="loan_lender"
                        type="text"
                        required
                        value={lender}
                        onChange={(e) => setLender(e.target.value)}
                        placeholder={t.lenderPlaceholder}
                        className={inputClass}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="loan_principal" className={labelClass}>
                            {t.principal}
                        </Label>
                        <Input
                            id="loan_principal"
                            type="number"
                            inputMode="decimal"
                            min={1}
                            step="any"
                            required
                            value={principal}
                            onChange={(e) => setPrincipal(e.target.value)}
                            placeholder="1000000"
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="loan_period" className={labelClass}>
                            {t.period}
                        </Label>
                        <select
                            id="loan_period"
                            value={period}
                            onChange={(e) => isLoanPeriod(e.target.value) && setPeriod(e.target.value)}
                            className={selectClass}
                        >
                            {LOAN_PERIODS.map((key) => (
                                <option key={key} value={key}>
                                    {t.periodOptions[key]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {schedule.length > 0 ? (
                    <div className="rounded-2xl bg-surface dark:border dark:border-border">
                        <div className="flex items-center justify-between px-4 pt-3 pb-1">
                            <p className="text-sm font-semibold text-foreground">
                                {t.contractSchedule} · {t.paymentsCount(schedule.length)}
                            </p>
                            <button
                                type="button"
                                onClick={() => setSchedule([])}
                                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                            >
                                {t.enterManually}
                            </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto divide-y divide-border">
                            {schedule.map((row, i) => (
                                <div key={`${row.dueDate}-${i}`} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-sm text-muted-foreground">
                                        {i + 1}. {formatDate(row.dueDate)}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {moneyFormatter(row.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="loan_installment" className={labelClass}>
                                    {t.installmentAmount}
                                </Label>
                                <Input
                                    id="loan_installment"
                                    type="number"
                                    inputMode="decimal"
                                    min={1}
                                    step="any"
                                    required
                                    value={installmentAmount}
                                    onChange={(e) => setInstallmentAmount(e.target.value)}
                                    placeholder="185000"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="loan_count" className={labelClass}>
                                    {t.installmentCount}
                                </Label>
                                <Input
                                    id="loan_count"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={120}
                                    step={1}
                                    required
                                    disabled={period === "once"}
                                    value={period === "once" ? "1" : installmentCount}
                                    onChange={(e) => setInstallmentCount(e.target.value)}
                                    placeholder="6"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loan_first_due" className={labelClass}>
                                {t.firstDueDate}
                            </Label>
                            <Input
                                id="loan_first_due"
                                type="date"
                                required
                                value={firstDueDate}
                                onChange={(e) => setFirstDueDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </>
                )}

                <div className="rounded-2xl border border-border">
                    <button
                        type="button"
                        onClick={() => setDetailsOpen((open) => !open)}
                        aria-expanded={detailsOpen}
                        className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground"
                    >
                        {t.detailsOptional}
                        <ChevronDown
                            className={cn("size-4 text-muted-foreground transition-transform", detailsOpen && "rotate-180")}
                        />
                    </button>

                    {detailsOpen && (
                        <div className="space-y-4 px-4 pb-4">
                            <div className="space-y-2">
                                <Label htmlFor="loan_type" className={labelClass}>
                                    {t.loanType}
                                </Label>
                                <Input
                                    id="loan_type"
                                    value={loanType}
                                    onChange={(e) => setLoanType(e.target.value)}
                                    placeholder={t.loanTypePlaceholder}
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="loan_contract_no" className={labelClass}>
                                        {t.contractNumber}
                                    </Label>
                                    <Input
                                        id="loan_contract_no"
                                        value={contractNumber}
                                        onChange={(e) => setContractNumber(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loan_contract_date" className={labelClass}>
                                        {t.contractDate}
                                    </Label>
                                    <Input
                                        id="loan_contract_date"
                                        type="date"
                                        value={contractDate}
                                        onChange={(e) => setContractDate(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="loan_rate" className={labelClass}>
                                        {t.interestRate} (%)
                                    </Label>
                                    <Input
                                        id="loan_rate"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="any"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(e.target.value)}
                                        placeholder="3.5"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loan_rate_unit" className={labelClass}>
                                        {t.period}
                                    </Label>
                                    <select
                                        id="loan_rate_unit"
                                        value={rateUnit}
                                        onChange={(e) => setRateUnit(e.target.value === "yearly" ? "yearly" : "monthly")}
                                        className={selectClass}
                                    >
                                        <option value="monthly">{t.rateUnit.monthly}</option>
                                        <option value="yearly">{t.rateUnit.yearly}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="loan_fees" className={labelClass}>
                                        {t.fees}
                                    </Label>
                                    <Input
                                        id="loan_fees"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="any"
                                        value={fees}
                                        onChange={(e) => setFees(e.target.value)}
                                        placeholder="0"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loan_maturity" className={labelClass}>
                                        {t.maturityDate}
                                    </Label>
                                    <Input
                                        id="loan_maturity"
                                        type="date"
                                        value={maturityDate}
                                        onChange={(e) => setMaturityDate(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showSummary && (
                    <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-muted-foreground">{t.totalToRepay}</span>
                            <span className="text-sm font-semibold text-foreground">
                                {moneyFormatter(total)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-muted-foreground">{t.interest}</span>
                            <span className="text-sm font-semibold text-expense">
                                {moneyFormatter(Math.max(0, interest))}
                            </span>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSaving || isReading}
                    className="w-full rounded-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t.createLoan}
                </Button>
            </form>
        </>
    );
};
