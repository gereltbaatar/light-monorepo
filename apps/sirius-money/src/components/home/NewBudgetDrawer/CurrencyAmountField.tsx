"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { formatAmount } from "@/lib/format-amount";
import { useT } from "@/lib/i18n/client";
import { budgetsDict } from "@/lib/i18n/dictionaries/goals";
import { AmountInput } from "./AmountInput";
import { selectTriggerClass } from "./shared";

const MNT = "MNT";

interface CurrencyAmountFieldProps {
    id: string;
    name: string;
    placeholder: string;
    rates?: ExchangeRates | null;
}

export const CurrencyAmountField = ({
    id,
    name,
    placeholder,
    rates,
}: CurrencyAmountFieldProps) => {
    const t = useT(budgetsDict);
    const [currency, setCurrency] = useState(MNT);
    const [amount, setAmount] = useState("");
    const options = rates?.rates ?? [];
    const selected = options.find((option) => option.code === currency);
    const amountMnt = selected && amount ? Math.round(Number(amount) * selected.rate) : null;

    return (
        <>
            <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                    <AmountInput
                        id={id}
                        name={name}
                        value={amount}
                        onValueChange={setAmount}
                        allowDecimal={selected !== undefined}
                        placeholder={
                            selected && rates
                                ? t.rateLine(
                                      selected.code,
                                      formatAmount(selected.rate.toFixed(2)),
                                      rates.date
                                  )
                                : placeholder
                        }
                    />
                </div>
                {options.length > 0 && (
                    <Select
                        value={currency}
                        onValueChange={(next) => {
                            setCurrency(next);
                            // Tugrik amounts are whole numbers.
                            if (next === MNT) setAmount((prev) => prev.split(".")[0] ?? "");
                        }}
                    >
                        <SelectTrigger
                            aria-label={t.currency}
                            className={`${selectTriggerClass} w-24 shrink-0`}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-60">
                            <SelectItem value={MNT}>{MNT}</SelectItem>
                            {options.map((option) => (
                                <SelectItem key={option.code} value={option.code}>
                                    {option.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {amountMnt !== null && (
                <p className="px-1 text-xs text-muted-foreground">
                    {t.approxMnt(formatAmount(String(amountMnt)))}
                </p>
            )}

            <input type="hidden" name="currency" value={currency} />
            {amountMnt !== null && (
                <input type="hidden" name={`${name}_mnt`} value={amountMnt} />
            )}
        </>
    );
};
