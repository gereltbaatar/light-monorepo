"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { moneyFormatter } from "@/components/functions";

interface SpendingBarsProps {
    bars: Array<{ label: string; amount: number; current: boolean }>;
}

export const SpendingBars = ({ bars }: SpendingBarsProps) => {
    const max = Math.max(...bars.map((bar) => bar.amount), 0);
    const peak = bars.findIndex((bar) => bar.amount === max && max > 0);
    const [selected, setSelected] = useState(peak >= 0 ? peak : bars.findIndex((b) => b.current));

    return (
        <div className="flex h-52 items-end gap-1.5 pt-6">
            {bars.map((bar, index) => {
                const active = index === selected;
                const height = max > 0 ? Math.max((bar.amount / max) * 100, 3) : 3;

                return (
                    <button
                        key={bar.label}
                        type="button"
                        onClick={() => setSelected(index)}
                        aria-label={`${bar.label}: ${moneyFormatter(Math.round(bar.amount))}`}
                        aria-pressed={active}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                        <div className="relative flex w-full flex-1 items-end justify-center">
                            {active && (
                                <span
                                    className={cn(
                                        "absolute whitespace-nowrap text-xs font-semibold text-foreground",
                                        // Edge bars anchor their label inward so it never leaves the card.
                                        index === 0
                                            ? "left-0"
                                            : index === bars.length - 1
                                              ? "right-0"
                                              : "left-1/2 -translate-x-1/2"
                                    )}
                                    style={{ bottom: `calc(${height}% + 6px)` }}
                                >
                                    {moneyFormatter(Math.round(bar.amount))}
                                </span>
                            )}
                            <span
                                className={cn(
                                    "w-full max-w-10 rounded-lg transition-colors duration-200",
                                    active ? "bg-accent-orange" : "bg-surface-2"
                                )}
                                style={{ height: `${height}%` }}
                            />
                        </div>
                        <span
                            className={cn(
                                "truncate text-[11px]",
                                active || bar.current
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            {bar.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
