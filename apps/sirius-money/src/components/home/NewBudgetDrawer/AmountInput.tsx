"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Input } from "@workspace/ui/components/input";
import { formatAmount } from "@/lib/format-amount";
import { inputClass } from "./shared";

interface AmountInputProps {
    id: string;
    name: string;
    placeholder?: string;
    allowDecimal?: boolean;
    required?: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
}

// Mobile decimal keypads may offer a comma instead of a dot.
const sanitize = (input: string, allowDecimal: boolean) => {
    const cleaned = input
        .replace(/,/g, ".")
        .replace(allowDecimal ? /[^\d.]/g : /\D/g, "");
    const [whole = "", ...rest] = cleaned.split(".");
    const integer = whole.replace(/^0+(?=\d)/, "");
    if (!allowDecimal || rest.length === 0) return integer;
    return `${integer || "0"}.${rest.join("").slice(0, 2)}`;
};

// Caret index sitting right after the nth digit or dot of a formatted string.
const caretAfterChars = (formatted: string, count: number) => {
    if (count === 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/[\d.]/.test(formatted[i]!) && ++seen === count) return i + 1;
    }
    return formatted.length;
};

export const AmountInput = ({
    id,
    name,
    placeholder,
    allowDecimal = false,
    required,
    value,
    onValueChange,
}: AmountInputProps) => {
    const ref = useRef<HTMLInputElement>(null);
    const pendingCaret = useRef<number | null>(null);
    const [ownValue, setOwnValue] = useState("");
    const raw = value ?? ownValue;
    const formatted = formatAmount(raw);

    useLayoutEffect(() => {
        if (pendingCaret.current === null || !ref.current) return;
        const caret = caretAfterChars(formatted, pendingCaret.current);
        ref.current.setSelectionRange(caret, caret);
        pendingCaret.current = null;
    }, [formatted]);

    return (
        <>
            <Input
                ref={ref}
                id={id}
                type="text"
                inputMode={allowDecimal ? "decimal" : "numeric"}
                autoComplete="off"
                required={required}
                value={formatted}
                onChange={(e) => {
                    const { value: typed, selectionStart } = e.target;
                    const next = sanitize(typed, allowDecimal);
                    pendingCaret.current = sanitize(
                        typed.slice(0, selectionStart ?? typed.length),
                        allowDecimal
                    ).length;
                    setOwnValue(next);
                    onValueChange?.(next);
                }}
                placeholder={
                    placeholder && /^\d+$/.test(placeholder)
                        ? formatAmount(placeholder)
                        : placeholder
                }
                className={inputClass}
            />
            <input type="hidden" name={name} value={raw} />
        </>
    );
};
