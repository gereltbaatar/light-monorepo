"use client";

import Image from "next/image";
import Link from "next/link";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { moneyFormatter } from "../functions";
import type { Goal } from "@/lib/goals";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const goalPercent = (goal: Pick<Goal, "saved_amount" | "target_amount">) =>
    Math.max(0, Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100)));

export const GoalCard = ({ goal }: { goal: Goal }) => {
    const t = useT(homeDict);
    const percent = goalPercent(goal);

    return (
        <Link href={`/goals/${goal.id}`} className="shrink-0">
            <div className="h-[220px] w-[155px] bg-surface rounded-3xl">
                <div className="w-full h-full px-3 py-3 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold text-foreground tracking-tight">
                            {t.goal}
                        </p>
                        {goal.status === "completed" && (
                            <span className="rounded-full bg-[#00A86B] px-2 py-0.5 text-[10px] font-semibold text-white">
                                {t.goalDone}
                            </span>
                        )}
                    </div>

                    <div className="w-24 h-24 mx-auto mb-3">
                        <CircularProgressbarWithChildren
                            value={percent}
                            strokeWidth={8}
                            styles={buildStyles({
                                pathColor: "var(--foreground)",
                                trailColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
                                strokeLinecap: "round",
                            })}
                        >
                            {goal.image_url ? (
                                <div className="relative size-[68px]">
                                    <div className="relative size-full overflow-hidden rounded-full">
                                        <Image
                                            src={goal.image_url}
                                            alt={goal.title}
                                            fill
                                            sizes="68px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-px text-[10px] font-bold text-background">
                                        {percent}%
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[26px] text-foreground">{percent}%</span>
                            )}
                        </CircularProgressbarWithChildren>
                    </div>

                    <div className="text-center mt-auto">
                        <p className="truncate text-sm font-semibold text-foreground mb-0.5">
                            {goal.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {moneyFormatter(goal.saved_amount)} / {moneyFormatter(goal.target_amount)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
