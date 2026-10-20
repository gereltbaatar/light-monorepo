"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { setPreferredCurrencies } from "@/app/_actions/currencies";
import { formatAmount } from "@/lib/format-amount";
import { useT } from "@/lib/i18n/client";
import { currenciesDict } from "@/lib/i18n/dictionaries/currencies";
import { toast } from "@/lib/toast";

interface CurrencyOption {
    code: string;
    name: string;
    rate: number;
}

interface CurrencyPickerProps {
    currencies: CurrencyOption[];
    initialSelected: string[];
    rateDate: string;
    baseName: string;
}

export const CurrencyPicker = ({
    currencies,
    initialSelected,
    rateDate,
    baseName,
}: CurrencyPickerProps) => {
    const router = useRouter();
    const t = useT(currenciesDict);
    const [selected, setSelected] = useState(initialSelected);
    const [query, setQuery] = useState("");
    const [, startTransition] = useTransition();

    const needle = query.trim().toLowerCase();
    const matches = (code: string, name: string) =>
        !needle || code.toLowerCase().includes(needle) || name.toLowerCase().includes(needle);
    const visible = currencies.filter((currency) => matches(currency.code, currency.name));
    const chosen = visible.filter((currency) => selected.includes(currency.code));
    const rest = visible.filter((currency) => !selected.includes(currency.code));
    const showBase = matches("MNT", baseName);

    const toggle = (code: string, checked: boolean) => {
        const previous = selected;
        const next = checked
            ? [...selected, code]
            : selected.filter((item) => item !== code);
        setSelected(next);
        startTransition(async () => {
            const result = await setPreferredCurrencies(next);
            if ("error" in result) {
                setSelected(previous);
                toast.error(t.failed);
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="space-y-5">
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.search}
                    aria-label={t.search}
                    className="h-12 rounded-2xl border-border bg-surface pl-11 text-foreground placeholder:text-muted-foreground/70"
                />
            </div>

            {!showBase && visible.length === 0 && (
                <p className="rounded-3xl bg-surface px-4 py-4 text-sm text-muted-foreground">
                    {t.noMatch}
                </p>
            )}

            {(showBase || chosen.length > 0) && (
                <CurrencyGroup title={t.selectedGroup}>
                    {showBase && <CurrencyRow code="MNT" name={baseName} checked disabled />}
                    {chosen.map((currency) => (
                        <CurrencyRow
                            key={currency.code}
                            {...currency}
                            checked
                            onCheckedChange={(checked) => toggle(currency.code, checked)}
                        />
                    ))}
                </CurrencyGroup>
            )}

            {rest.length > 0 && (
                <CurrencyGroup title={t.otherGroup}>
                    {rest.map((currency) => (
                        <CurrencyRow
                            key={currency.code}
                            {...currency}
                            checked={false}
                            onCheckedChange={(checked) => toggle(currency.code, checked)}
                        />
                    ))}
                </CurrencyGroup>
            )}

            <p className="px-1 text-xs text-muted-foreground">{t.rateSource(rateDate)}</p>
        </div>
    );
};

const CurrencyGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-2">
        <h2 className="px-1 text-sm text-muted-foreground">{title}</h2>
        <div className="w-full overflow-hidden rounded-3xl bg-surface divide-y divide-border">
            {children}
        </div>
    </section>
);

interface CurrencyRowProps {
    code: string;
    name: string;
    rate?: number;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const CurrencyRow = ({ code, name, rate, checked, disabled, onCheckedChange }: CurrencyRowProps) => {
    const id = `currency_${code}`;
    return (
        <label
            htmlFor={id}
            className={`flex h-[60px] items-center gap-3 px-4 transition-colors ${
                disabled ? "" : "cursor-pointer active:bg-surface-2"
            }`}
        >
            <span className="w-10 shrink-0 text-sm font-semibold text-foreground">{code}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground first-letter:uppercase">
                {name}
            </span>
            {rate !== undefined && (
                <span className="shrink-0 text-sm tabular-nums text-foreground">
                    {formatAmount(rate.toFixed(2))}₮
                </span>
            )}
            <Switch
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={onCheckedChange}
                className="disabled:opacity-60"
            />
        </label>
    );
};
