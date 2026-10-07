import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { getAdvice } from "@/app/_actions/advisor";

const TONE = {
    good: { Icon: CheckCircle2, className: "text-green-600 dark:text-green-500" },
    warn: { Icon: AlertTriangle, className: "text-orange-500" },
    info: { Icon: Sparkles, className: "text-blue-500" },
} as const;

export const AdviceSection = async () => {
    const advice = await getAdvice();

    if ("error" in advice) {
        return (
            <div className="rounded-3xl bg-surface p-4 text-sm text-muted-foreground">
                {advice.error}
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-surface p-4">
            <div className="flex items-center gap-2 pb-3">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-foreground">{advice.headline}</p>
            </div>
            <div className="space-y-3">
                {advice.insights.map((insight, index) => {
                    const { Icon, className } = TONE[insight.tone];
                    return (
                        <div key={index} className="flex gap-3 rounded-2xl bg-surface-2 p-3">
                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
                            <div>
                                <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                                <p className="pt-0.5 text-sm text-muted-foreground">{insight.detail}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const AdviceSkeleton = ({ label }: { label: string }) => (
    <div className="space-y-3 rounded-3xl bg-surface p-4">
        <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
        ))}
    </div>
);
