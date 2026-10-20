"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { loansDict } from "@/lib/i18n/dictionaries/loans";
import { CONTRACT_BUCKET } from "@/lib/loans";
import {
    isLoanPeriod,
    type LoanContractDetails,
    type LoanPeriod,
    type ScheduleRow,
} from "@/lib/loan-contract";
import { parseLoanContract } from "./parse-loan-contract";
import { deleteTransaction, saveTransaction } from "./transactions";

export type LoanActionResult = { error: string } | { ok: true; id?: string };

export interface CreateLoanInput {
    lender: string;
    principal: number;
    installmentAmount: number;
    installmentCount: number;
    period: LoanPeriod;
    firstDueDate: string;
    details?: LoanContractDetails;
    /** Rows read off the contract; when present they replace the equal-installment schedule. */
    schedule?: ScheduleRow[];
    contractPath?: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_STEPS: Partial<Record<LoanPeriod, number>> = { monthly: 1, quarterly: 3, yearly: 12 };

const isPositive = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

const tableMissing = (message: string) =>
    message.includes("Could not find the table") || message.includes("does not exist");

// Month steps clamp to the last day, so a loan due on the 31st falls on Feb 28.
function dueDate(first: string, period: LoanPeriod, step: number) {
    const [y, m, d] = first.split("-").map(Number);
    const months = MONTH_STEPS[period];
    if (!months) {
        const days = period === "weekly" ? 7 : 15;
        return new Date(Date.UTC(y, m - 1, d + step * days)).toISOString().slice(0, 10);
    }
    const offset = step * months;
    const lastDay = new Date(Date.UTC(y, m + offset, 0)).getUTCDate();
    return new Date(Date.UTC(y, m - 1 + offset, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

const optionalDate = (value?: string) => (value && DATE_PATTERN.test(value) ? value : null);
const optionalMoney = (value?: number) => (isPositive(value) ? Math.round(value * 100) / 100 : null);

function detailColumns(details: LoanContractDetails = {}) {
    const rate = details.interestRate;
    const hasRate = typeof rate === "number" && Number.isFinite(rate) && rate >= 0 && rate <= 1000;
    return {
        loan_type: details.loanType?.trim() || null,
        contract_number: details.contractNumber?.trim() || null,
        contract_date: optionalDate(details.contractDate),
        maturity_date: optionalDate(details.maturityDate),
        interest_rate: hasRate ? rate : null,
        interest_rate_unit: hasRate ? (details.interestRateUnit === "yearly" ? "yearly" : "monthly") : null,
        fees: optionalMoney(details.fees),
    };
}

const validSchedule = (rows: ScheduleRow[]) =>
    rows.length >= 1 &&
    rows.length <= 120 &&
    rows.every((row) => DATE_PATTERN.test(row.dueDate) && isPositive(row.amount));

function revalidateLoans(id?: string) {
    revalidatePath("/");
    if (id) revalidatePath(`/loans/${id}`);
}

export async function createLoan(input: CreateLoanInput): Promise<LoanActionResult> {
    const { errors } = await getT(loansDict);
    const lender = input.lender?.trim();
    if (!lender) return { error: errors.lenderRequired };
    if (!isPositive(input.principal)) return { error: errors.principalPositive };
    if (!isLoanPeriod(input.period)) return { error: errors.invalidPeriod };

    const contractSchedule = input.schedule?.length ? input.schedule : null;
    if (contractSchedule) {
        if (!validSchedule(contractSchedule)) return { error: errors.invalidSchedule };
    } else {
        if (!isPositive(input.installmentAmount)) return { error: errors.installmentPositive };
        if (
            !Number.isInteger(input.installmentCount) ||
            input.installmentCount < 1 ||
            input.installmentCount > 120
        ) {
            return { error: errors.countRange };
        }
        if (input.period === "once" && input.installmentCount !== 1) return { error: errors.onceSingle };
        if (!input.firstDueDate || !DATE_PATTERN.test(input.firstDueDate)) {
            return { error: errors.pickFirstDate };
        }
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: errors.signedOut };

    // Paths are minted by parseLoanContract under the caller's folder; anything else is forged.
    const contractPath = input.contractPath?.startsWith(`${user.id}/`) ? input.contractPath : null;

    const rows: ScheduleRow[] =
        contractSchedule ??
        Array.from({ length: input.installmentCount }, (_, i) => ({
            dueDate: dueDate(input.firstDueDate, input.period, i),
            amount: input.installmentAmount,
            principal: null,
            interest: null,
        }));
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    const { data, error } = await supabase
        .from("ex_loans")
        .insert({
            user_id: user.id,
            lender,
            principal: input.principal,
            installment_amount: Math.round((total / rows.length) * 100) / 100,
            installment_count: rows.length,
            period: input.period,
            first_due_date: rows[0].dueDate,
            contract_path: contractPath,
            ...detailColumns(input.details),
        })
        .select("id")
        .single();

    if (error || !data) {
        if (error && tableMissing(error.message)) return { error: errors.tableMissing };
        return { error: error?.message ?? errors.createFailed };
    }

    const payments = rows.map((row, i) => ({
        loan_id: data.id,
        user_id: user.id,
        seq: i + 1,
        due_date: row.dueDate,
        amount: row.amount,
        principal_part: row.principal,
        interest_part: row.interest,
    }));
    const { error: scheduleError } = await supabase.from("ex_loan_payments").insert(payments);
    // A loan without its schedule would show as fully repaid, so drop it.
    if (scheduleError) {
        await supabase.from("ex_loans").delete().eq("id", data.id);
        return { error: scheduleError.message };
    }

    revalidateLoans();
    return { ok: true, id: data.id };
}

// Paying records an expense, so the repayment shows up in transactions and the balance.
export async function setLoanPaymentPaid(
    paymentId: string,
    paid: boolean,
    today: string
): Promise<LoanActionResult> {
    const { errors, paymentTitle } = await getT(loansDict);
    if (!DATE_PATTERN.test(today)) return { error: errors.invalidDate };

    const supabase = await createClient();
    const { data: payment } = await supabase
        .from("ex_loan_payments")
        .select("id, loan_id, seq, amount, paid_at, transaction_id")
        .eq("id", paymentId)
        .maybeSingle();
    if (!payment) return { error: errors.notFound };

    if (!paid) {
        const { error } = await supabase
            .from("ex_loan_payments")
            .update({ paid_at: null, transaction_id: null })
            .eq("id", paymentId);
        if (error) return { error: error.message };
        if (payment.transaction_id) await deleteTransaction(payment.transaction_id);
        revalidateLoans(payment.loan_id);
        return { ok: true };
    }

    if (payment.paid_at) return { error: errors.alreadyPaid };

    const { data: loan } = await supabase
        .from("ex_loans")
        .select("lender, installment_count")
        .eq("id", payment.loan_id)
        .maybeSingle();
    if (!loan) return { error: errors.notFound };

    const saved = await saveTransaction({
        type: "expense",
        title: paymentTitle(loan.lender, payment.seq, loan.installment_count),
        amount: Number(payment.amount),
        occurredAt: today,
        category: "bills",
    });
    if ("error" in saved) return saved;

    // Guarded on paid_at so a double tap can't record the same payment twice.
    const { data: updated, error } = await supabase
        .from("ex_loan_payments")
        .update({ paid_at: new Date().toISOString(), transaction_id: saved.id })
        .eq("id", paymentId)
        .is("paid_at", null)
        .select("id");
    if (error || !updated?.length) {
        if (saved.id) await deleteTransaction(saved.id);
        return { error: error?.message ?? errors.alreadyPaid };
    }

    revalidateLoans(payment.loan_id);
    return { ok: true };
}

// Fills only the contract fields still empty, so nothing the user typed is overwritten.
export async function attachLoanContract(loanId: string, formData: FormData): Promise<LoanActionResult> {
    const { errors } = await getT(loansDict);
    const supabase = await createClient();

    const { data: loan } = await supabase
        .from("ex_loans")
        .select("contract_path, loan_type, contract_number, contract_date, maturity_date, interest_rate, fees")
        .eq("id", loanId)
        .maybeSingle();
    if (!loan) return { error: errors.notFound };

    const parsed = await parseLoanContract(formData);
    if ("error" in parsed) return parsed;

    const read = detailColumns(parsed.contract ?? {});
    const update: Record<string, unknown> = { contract_path: parsed.path };
    for (const [key, value] of Object.entries(read)) {
        if (value != null && loan[key as keyof typeof loan] == null) update[key] = value;
    }
    if (loan.interest_rate != null) delete update.interest_rate_unit;

    const { error } = await supabase.from("ex_loans").update(update).eq("id", loanId);
    if (error) {
        await supabase.storage.from(CONTRACT_BUCKET).remove([parsed.path]);
        return { error: error.message };
    }
    if (loan.contract_path) await supabase.storage.from(CONTRACT_BUCKET).remove([loan.contract_path]);

    revalidateLoans(loanId);
    return { ok: true };
}

// Drops a contract uploaded on the new-loan form that was never saved to a loan.
export async function discardLoanContract(path: string): Promise<LoanActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user || !path.startsWith(`${user.id}/`)) return { ok: true };
    await supabase.storage.from(CONTRACT_BUCKET).remove([path]);
    return { ok: true };
}

export async function deleteLoan(loanId: string): Promise<LoanActionResult> {
    const { errors } = await getT(loansDict);
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_loans")
        .delete()
        .eq("id", loanId)
        .select("id, contract_path");

    if (error) return { error: error.message };
    if (!data?.length) return { error: errors.notFound };
    if (data[0].contract_path) await supabase.storage.from(CONTRACT_BUCKET).remove([data[0].contract_path]);

    revalidateLoans();
    return { ok: true };
}
