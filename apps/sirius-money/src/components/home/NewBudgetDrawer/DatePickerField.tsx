"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@workspace/ui/components/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@workspace/ui/components/popover";
import type { Locale } from "@/lib/i18n/config";
import { DATE_LOCALE } from "@/lib/date-locale";
import { useLocale } from "@/lib/i18n/client";
import { selectTriggerClass } from "./shared";


// Mongolian long form overflows the half-width field.
const DISPLAY_FORMAT: Record<Locale, string> = { mn: "P", en: "PP" };

interface DatePickerFieldProps {
    id: string;
    name: string;
    /** Starts empty and shows this until a date is picked. */
    placeholder?: string;
}

export const DatePickerField = ({ id, name, placeholder }: DatePickerFieldProps) => {
    const locale = useLocale();
    const [date, setDate] = useState<Date | undefined>(() =>
        placeholder === undefined ? new Date() : undefined
    );
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    id={id}
                    type="button"
                    className={`${selectTriggerClass} flex items-center justify-between border text-sm`}
                >
                    <span className={date ? "truncate" : "truncate text-muted-foreground/70"}>
                        {date
                            ? format(date, DISPLAY_FORMAT[locale], {
                                  locale: DATE_LOCALE[locale],
                              })
                            : placeholder}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="z-60 w-auto overflow-hidden rounded-2xl border-border bg-surface p-0"
            >
                <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date ?? new Date()}
                    required
                    locale={DATE_LOCALE[locale]}
                    formatters={{
                        formatCaption: (month) =>
                            format(month, "LLLL y", { locale: DATE_LOCALE[locale] }),
                    }}
                    onSelect={(next) => {
                        setDate(next);
                        setOpen(false);
                    }}
                    className="bg-surface p-3 [--cell-size:2.5rem]"
                    classNames={{ caption_label: "text-sm font-semibold" }}
                />
            </PopoverContent>
            <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />
        </Popover>
    );
};
