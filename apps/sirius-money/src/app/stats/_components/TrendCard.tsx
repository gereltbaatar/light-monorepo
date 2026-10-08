"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { moneyFormatter } from "@/components/functions";

const W = 100;
const H = 40;
const TOP = 4;
const MAX_LABELS = 12;
const DENSE_LABELS = 6;

// Monotone cubic (Fritsch–Carlson) so the curve never overshoots between points.
function smoothPath(points: Array<[number, number]>) {
    const n = points.length;
    const slopes = points.slice(1).map(([x, y], i) => (y - points[i][1]) / (x - points[i][0]));
    const tangents = points.map((_, i) => {
        if (i === 0) return slopes[0];
        if (i === n - 1) return slopes[n - 2];
        const a = slopes[i - 1];
        const b = slopes[i];
        return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
    });

    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[i + 1];
        const dx = (x1 - x0) / 3;
        d += ` C${x0 + dx},${y0 + tangents[i] * dx} ${x1 - dx},${y1 - tangents[i + 1] * dx} ${x1},${y1}`;
    }
    return d;
}

const runningTotal = (values: number[]) =>
    values.map((_, i) => values.slice(0, i + 1).reduce((sum, value) => sum + value, 0));

interface Series {
    label: string;
    color: string;
    values: number[];
    /** Change vs the previous period, shown only while the period's end is selected. */
    change?: { text: string; good: boolean; up: boolean };
}

interface TrendCardProps {
    /** One full label per point, e.g. "Through October 5". */
    labels: string[];
    /** One short axis label per point, e.g. "5" or "Mon". */
    ticks: string[];
    income: Series;
    expense: Series;
    netLabel: string;
}

export const TrendCard = ({ labels, ticks, income, expense, netLabel }: TrendCardProps) => {
    const id = useId();
    const last = labels.length - 1;
    const [picked, setSelected] = useState(last);
    const selected = Math.min(picked, last);
    const [dragging, setDragging] = useState(false);

    // Running totals share one scale, so the two lines are directly comparable.
    const incomeTotals = runningTotal(income.values);
    const expenseTotals = runningTotal(expense.values);
    const max = Math.max(...incomeTotals, ...expenseTotals, 0);

    const toPoints = (totals: number[]) => {
        const series = totals.length === 1 ? [totals[0], totals[0]] : totals;
        return series.map((value, i): [number, number] => [
            (i / (series.length - 1)) * W,
            max > 0 ? H - (value / max) * (H - TOP) : H - 0.5,
        ]);
    };
    const lines = [
        { key: "income", series: income, points: toPoints(incomeTotals) },
        { key: "expense", series: expense, points: toPoints(expenseTotals) },
    ];

    const x = last > 0 ? (selected / last) * 100 : 100;
    const step = ticks.length > MAX_LABELS ? Math.ceil(ticks.length / DENSE_LABELS) : 1;
    const tickIndexes = ticks.map((_, i) => i).filter((i) => (last - i) % step === 0);

    const pick = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
        setSelected(Math.round(ratio * last));
    };

    const atEnd = selected === last;
    const net = incomeTotals[selected] - expenseTotals[selected];

    return (
        <section className="rounded-3xl bg-surface pt-5">
            <p className="px-5 text-sm font-medium text-muted-foreground">{labels[selected]}</p>

            <div className="grid grid-cols-2 gap-3 px-5 pt-2">
                {[
                    { series: income, total: incomeTotals[selected] },
                    { series: expense, total: expenseTotals[selected] },
                ].map(({ series, total }) => (
                    <div key={series.label} className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ background: series.color }} />
                            {series.label}
                        </p>
                        <p className="truncate pt-0.5 text-2xl font-bold tracking-tight text-foreground">
                            {moneyFormatter(Math.round(total))}
                        </p>
                        {atEnd && series.change && (
                            <p
                                className={cn(
                                    "flex items-center gap-1 text-xs font-semibold",
                                    series.change.good ? "text-income" : "text-expense"
                                )}
                            >
                                <span aria-hidden className="text-[9px]">
                                    {series.change.up ? "▲" : "▼"}
                                </span>
                                {series.change.text}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div
                className="relative mx-5 mt-4 h-36 cursor-crosshair touch-pan-y select-none"
                onPointerDown={(event) => {
                    setDragging(true);
                    pick(event);
                }}
                onPointerMove={(event) => {
                    if (dragging || event.pointerType === "mouse") pick(event);
                }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onPointerLeave={(event) => {
                    setDragging(false);
                    if (event.pointerType === "mouse") setSelected(last);
                }}
                role="img"
                aria-label={`${income.label} ${moneyFormatter(Math.round(incomeTotals[last]))}, ${expense.label} ${moneyFormatter(Math.round(expenseTotals[last]))}`}
            >
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible">
                    <defs>
                        {lines.map(({ key, series }) => (
                            <linearGradient key={key} id={`${id}-${key}`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={series.color} stopOpacity={0.28} />
                                <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    {lines.map(({ key, points }) => (
                        <path
                            key={key}
                            d={`${smoothPath(points)} L${W},${H} L0,${H} Z`}
                            fill={`url(#${id}-${key})`}
                        />
                    ))}
                    {lines.map(({ key, series, points }) => (
                        <path
                            key={key}
                            d={smoothPath(points)}
                            fill="none"
                            stroke={series.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>

                <span
                    className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20"
                    style={{ left: `${x}%` }}
                />
                {lines.map(({ key, series, points }) => (
                    <span
                        key={key}
                        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
                        style={{
                            left: `${x}%`,
                            top: `${(points[labels.length === 1 ? 1 : selected][1] / H) * 100}%`,
                            background: series.color,
                        }}
                    />
                ))}
            </div>

            {/* Axis dates stay visible, since phones have no hover */}
            <div className="relative mx-5 h-8 text-[11px] text-muted-foreground tabular-nums">
                {tickIndexes.map((index) => {
                    const left = last > 0 ? (index / last) * 100 : 100;
                    return (
                        <span
                            key={index}
                            className={cn(
                                "absolute top-2 whitespace-nowrap",
                                index === selected && "font-semibold text-foreground",
                                left === 0 ? "" : left === 100 ? "-translate-x-full" : "-translate-x-1/2"
                            )}
                            style={{ left: `${left}%` }}
                        >
                            {ticks[index]}
                        </span>
                    );
                })}
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3.5 text-sm">
                <span className="text-muted-foreground">{netLabel}</span>
                <span className="font-semibold text-foreground">
                    {net < 0 ? "−" : ""}
                    {moneyFormatter(Math.round(Math.abs(net)))}
                </span>
            </div>
        </section>
    );
};
