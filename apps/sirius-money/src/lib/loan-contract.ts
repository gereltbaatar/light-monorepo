export const LOAN_PERIODS = ["weekly", "semimonthly", "monthly", "quarterly", "yearly", "once"] as const;
export type LoanPeriod = (typeof LOAN_PERIODS)[number];
export type InterestRateUnit = "monthly" | "yearly";

export interface ScheduleRow {
    dueDate: string;
    amount: number;
    principal: number | null;
    interest: number | null;
}

export interface LoanContractDetails {
    loanType?: string;
    contractNumber?: string;
    contractDate?: string;
    maturityDate?: string;
    interestRate?: number;
    interestRateUnit?: InterestRateUnit;
    fees?: number;
}

export interface ParsedLoanContract extends LoanContractDetails {
    lender: string;
    principal: number;
    period: LoanPeriod;
    schedule: ScheduleRow[];
    confident: boolean;
}

export const isLoanPeriod = (value: unknown): value is LoanPeriod =>
    typeof value === "string" && (LOAN_PERIODS as readonly string[]).includes(value);
