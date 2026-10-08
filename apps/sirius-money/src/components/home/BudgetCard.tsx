"use client";

import { Ellipsis } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const BudgetCard = () => {
    const t = useT(homeDict);
    const percentage = 20;

    return (
        <div className="h-[220px] w-[155px] bg-surface shrink-0 rounded-3xl">
            <div className="w-full h-full px-3 py-3 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-lg font-bold text-foreground tracking-tight">
                        {t.budget}
                    </p>
                    <Ellipsis className="text-foreground" size={24} strokeWidth={2} />
                </div>

                {/* Circular Progress */}
                <div className="w-20 h-20 mx-auto mb-3">
                    <CircularProgressbar
                        value={percentage}
                        text={`${percentage}%`}
                        styles={buildStyles({
                            textSize: "28px",
                            pathColor: "var(--foreground)",
                            textColor: "var(--foreground)",
                            trailColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
                            strokeLinecap: "round",
                        })}
                        strokeWidth={8}
                    />
                </div>

                {/* Goal Info */}
                <div className="text-center mt-auto">
                    <p className="text-sm font-semibold text-foreground mb-0.5">
                        {t.budgetSample}
                    </p>
                    <p className="text-xs text-muted-foreground">1 Dec 2023</p>
                </div>
            </div>
        </div>
    );
};