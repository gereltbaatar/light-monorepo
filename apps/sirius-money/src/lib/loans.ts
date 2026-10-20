import "server-only";

import type { InterestRateUnit, LoanPeriod } from "@/lib/loan-contract";
import { createClient } from "@/lib/supabase/server";

export const CONTRACT_BUCKET = "loan-contracts";

export type { LoanPeriod };

export interface Loan {
    id: string;
    lender: string;
    principal: number;
    installment_amount: number;
    installment_count: number;
    period: LoanPeriod;
    first_due_date: string;
    total_amount: number;
    paid_amount: number;
    paid_count: number;
    next_due_date: string | null;
    created_at: string;
    loan_type: string | null;
    contract_number: string | null;
    contract_date: string | null;
    maturity_date: string | null;
    interest_rate: number | null;
    interest_rate_unit: InterestRateUnit | null;
    fees: number | null;
    contract_path: string | null;
}

export interface LoanPayment {
    id: string;
    seq: number;
    due_date: string;
    amount: number;
    principal_part: number | null;
    interest_part: number | null;
    paid_at: string | null;
}

const LOAN_COLUMNS =
    "id, lender, principal, installment_amount, installment_count, period, first_due_date, total_amount, paid_amount, paid_count, next_due_date, created_at, loan_type, contract_number, contract_date, maturity_date, interest_rate, interest_rate_unit, fees, contract_path";

const numberOrNull = (value: unknown) => (value == null ? null : Number(value));

// numeric columns arrive as strings from PostgREST.
const toLoan = (row: Record<string, unknown>): Loan =>
    ({
        ...row,
        principal: Number(row.principal),
        installment_amount: Number(row.installment_amount),
        total_amount: Number(row.total_amount),
        paid_amount: Number(row.paid_amount),
        interest_rate: numberOrNull(row.interest_rate),
        fees: numberOrNull(row.fees),
    }) as Loan;

export async function getLoans(): Promise<Loan[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_loan_progress")
        .select(LOAN_COLUMNS)
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(toLoan);
}

export async function getLoan(id: string): Promise<Loan | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_loan_progress")
        .select(LOAN_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error || !data) return null;
    return toLoan(data);
}

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ex_loan_payments")
        .select("id, seq, due_date, amount, principal_part, interest_part, paid_at")
        .eq("loan_id", loanId)
        .order("seq", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
        ...row,
        amount: Number(row.amount),
        principal_part: numberOrNull(row.principal_part),
        interest_part: numberOrNull(row.interest_part),
    })) as LoanPayment[];
}

// Signed so the private contract opens in a new tab without exposing the bucket.
export async function getContractUrl(path: string | null): Promise<string | null> {
    if (!path) return null;
    const supabase = await createClient();
    const { data } = await supabase.storage.from(CONTRACT_BUCKET).createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
}
