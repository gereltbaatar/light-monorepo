"use server";

import { Type } from "@google/genai";
import { errorStatus, generateWithFallback, getGemini } from "@workspace/sirius-core/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_BUCKET } from "@/lib/loans";
import {
    LOAN_PERIODS,
    isLoanPeriod,
    type ParsedLoanContract,
    type ScheduleRow,
} from "@/lib/loan-contract";
import { getT } from "@/lib/i18n/server";
import { isAiFeatureEnabled } from "@/lib/ai-features-server";
import { loansDict } from "@/lib/i18n/dictionaries/loans";

export type ParseLoanContractResult =
    | { error: string }
    | { path: string; fileName: string; contract: ParsedLoanContract | null; warning?: string };

const MAX_BYTES = 7 * 1024 * 1024;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const SYSTEM_PROMPT = `You read Mongolian loan contracts (зээлийн гэрээ) and return structured data.

The text is Mongolian Cyrillic, which includes Ө/ө and Ү/ү that do not exist in Russian.

LENDER
Use the brand the borrower knows the lender by: the app or bank brand in the logo or
text (e.g. "Zeely", "M bank", "Хаан банк", "LendMN"), not the legal entity name
("Хатан Суудал Инвест ББСБ ХХК" is offered through the app "Zeely", so return "Zeely").

TERMS
- principal: "Зээлийн хэмжээ" — the amount borrowed.
- interestRate: the nominal rate in percent, from "Зээлийн хүү".
  interestRateUnit: "monthly" for "(сараар)" or "сарын", "yearly" for "/жилийн/" or "жилийн".
  NOT "Зээлийн бодит өртөг" (effective cost) and NOT "Нэмэгдүүлсэн хүү" (penalty rate).
- fees: sum of one-off fees such as "шимтгэл", "хураамж", "Өргөдөл судалсны хураамж". 0 if none.
- loanType: "Зээлийн зориулалт" or "Зээлийн бүтээгдэхүүний нэр", e.g. "Хэрэглээний зээл".
- contractNumber: the number after "№" or "Дугаар".
- contractDate: the contract's own date ("Огноо", or "2026 оны 07 сарын 15 өдөр" at the top).
- maturityDate: "Зээл төлөгдөж дуусах огноо", otherwise the last repayment date.

REPAYMENT SCHEDULE ("Эргэн төлөлтийн хуваарь")
Return one row per payment with dueDate, principal, interest and amount (total paid that day).
Read columns by their header — lenders order them differently:
  "Үндсэн зээл" = principal part, "Хүү" = interest part, "Нийт төлөх дүн" / "Нийт дүн" = amount.
"Үндсэн зээлийн үлдэгдэл" is the remaining balance, never a payment — ignore it.
Skip rows with no payment, such as a row 0 that only shows the disbursement date and balance.
Payments are often unequal; copy each row exactly, never average them.

PERIOD
"Сард 2 удаа" means semimonthly. A single payment means once. Otherwise infer from the
gap between schedule dates: ~7 days weekly, ~15 days semimonthly, ~1 month monthly,
~3 months quarterly, ~12 months yearly.

SELF-CHECK
Set confident=true only when the principal parts add up to the principal and every row's
amount equals its principal plus interest. Never invent numbers to make them agree.

Dates as yyyy-mm-dd; empty string when absent. Amounts are tugrik, plain numbers with up to
two decimals and no separators or currency symbols.`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        lender: { type: Type.STRING, description: "Brand the borrower knows the lender by" },
        principal: { type: Type.NUMBER, description: "Amount borrowed in MNT" },
        interestRate: { type: Type.NUMBER, description: "Nominal interest rate in percent, 0 if absent" },
        interestRateUnit: { type: Type.STRING, format: "enum", enum: ["monthly", "yearly"] },
        fees: { type: Type.NUMBER, description: "One-off fees in MNT, 0 if none" },
        loanType: { type: Type.STRING, description: "Loan purpose or product name" },
        contractNumber: { type: Type.STRING },
        contractDate: { type: Type.STRING, description: "yyyy-mm-dd or empty" },
        maturityDate: { type: Type.STRING, description: "yyyy-mm-dd or empty" },
        period: { type: Type.STRING, format: "enum", enum: [...LOAN_PERIODS] },
        schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dueDate: { type: Type.STRING, description: "yyyy-mm-dd" },
                    principal: { type: Type.NUMBER },
                    interest: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER, description: "Total paid on this date" },
                },
                required: ["dueDate", "principal", "interest", "amount"],
            },
        },
        confident: { type: Type.BOOLEAN },
    },
    required: [
        "lender",
        "principal",
        "interestRate",
        "interestRateUnit",
        "fees",
        "loanType",
        "contractNumber",
        "contractDate",
        "maturityDate",
        "period",
        "schedule",
        "confident",
    ],
};

const money = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0;
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const date = (value: unknown) => {
    const s = text(value);
    return s && DATE_PATTERN.test(s) ? s : undefined;
};

function sanitizeSchedule(raw: unknown): ScheduleRow[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((row: Record<string, unknown>) => ({
            dueDate: date(row?.dueDate) ?? "",
            amount: money(row?.amount),
            principal: money(row?.principal) || null,
            interest: money(row?.interest) || null,
        }))
        .filter((row) => row.dueDate && row.amount > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 120);
}

function toContract(raw: Record<string, unknown>): ParsedLoanContract | null {
    const schedule = sanitizeSchedule(raw.schedule);
    const principal = money(raw.principal);
    if (!principal && schedule.length === 0) return null;

    const period = isLoanPeriod(raw.period) ? raw.period : "monthly";
    return {
        lender: text(raw.lender) ?? "",
        principal,
        period: schedule.length === 1 ? "once" : period,
        schedule,
        confident: raw.confident === true && schedule.length > 0 && principal > 0,
        loanType: text(raw.loanType),
        contractNumber: text(raw.contractNumber),
        contractDate: date(raw.contractDate),
        maturityDate: date(raw.maturityDate) ?? schedule.at(-1)?.dueDate,
        interestRate: money(raw.interestRate) || undefined,
        interestRateUnit: raw.interestRateUnit === "yearly" ? "yearly" : "monthly",
        fees: money(raw.fees) || undefined,
    };
}

async function readContract(base64: string): Promise<ParsedLoanContract | null> {
    const ai = getGemini();
    if (!ai) return null;

    const response = await generateWithFallback(await createClient(), ai, {
        contents: [
            {
                role: "user",
                parts: [
                    { inlineData: { mimeType: "application/pdf", data: base64 } },
                    { text: "Read this loan contract and return its terms and full repayment schedule." },
                ],
            },
        ],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        },
    });
    return response.text ? toContract(JSON.parse(response.text)) : null;
}

// Stores the PDF first; reading it is best-effort so a failed read still keeps the file.
export async function parseLoanContract(formData: FormData): Promise<ParseLoanContractResult> {
    const { contractErrors: t } = await getT(loansDict);

    const file = formData.get("contract");
    if (!(file instanceof File) || file.size === 0) return { error: t.noFile };
    if (file.type !== "application/pdf") return { error: t.notPdf };
    if (file.size > MAX_BYTES) return { error: t.tooLarge };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: t.signedOut };

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = `${user.id}/${crypto.randomUUID()}.pdf`;
    const aiEnabled = Boolean(process.env.GEMINI_API_KEY) && (await isAiFeatureEnabled("receipt"));

    const [upload, read] = await Promise.allSettled([
        supabase.storage.from(CONTRACT_BUCKET).upload(path, bytes, { contentType: "application/pdf" }),
        aiEnabled ? readContract(bytes.toString("base64")) : Promise.resolve(null),
    ]);

    if (upload.status === "rejected" || upload.value.error) {
        const message = upload.status === "rejected" ? String(upload.reason) : upload.value.error!.message;
        console.error("[parseLoanContract] upload", message);
        return { error: /bucket not found/i.test(message) ? t.bucketMissing : t.uploadFailed };
    }

    const base = { path, fileName: file.name };
    if (!aiEnabled) return { ...base, contract: null };
    if (read.status === "rejected") {
        console.error("[parseLoanContract] read", read.reason);
        const status = errorStatus(read.reason);
        return { ...base, contract: null, warning: status === 429 ? t.quota : status === 503 ? t.busy : t.unreadable };
    }
    return read.value ? { ...base, contract: read.value } : { ...base, contract: null, warning: t.unreadable };
}
