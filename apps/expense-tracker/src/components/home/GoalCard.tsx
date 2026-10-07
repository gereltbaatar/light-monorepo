import Image from "next/image";
import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { Progress } from "@workspace/ui/components/progress";
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
            <div className="h-[220px] w-[155px] overflow-hidden rounded-3xl bg-surface flex flex-col">
                <div className="relative h-[92px] w-full bg-surface-2">
                    {goal.image_url ? (
                        <Image
                            src={goal.image_url}
                            alt={goal.title}
                            fill
                            sizes="155px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <PiggyBank className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                    {goal.status === "completed" && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#00A86B] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {t.goalDone}
                        </span>
                    )}
                </div>

                <div className="flex flex-1 flex-col px-3 py-3">
                    <p className="truncate text-sm font-bold text-foreground tracking-tight">
                        {goal.title}
                    </p>
                    <p className="pt-0.5 text-2xl font-bold text-foreground">{percent}%</p>

                    <div className="mt-auto space-y-1.5">
                        <Progress value={percent} className="h-1.5 bg-foreground/10" />
                        <p className="truncate text-[11px] text-muted-foreground">
                            {moneyFormatter(goal.saved_amount)} / {moneyFormatter(goal.target_amount)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
