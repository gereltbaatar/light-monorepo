import { getPopularQuestions } from "@/app/_actions/advisor";
import { getT } from "@/lib/i18n/server";
import { advisorDict } from "@/lib/i18n/dictionaries/advisor";
import { QuestionChips } from "./AdvisorChat";

export const QuestionsSection = async () => {
    const [result, t] = await Promise.all([getPopularQuestions(), getT(advisorDict)]);

    if ("error" in result) {
        return <p className="text-sm text-muted-foreground">{result.error}</p>;
    }

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
                {result.source === "search" ? t.trendingQuestions : t.popularQuestions}
            </p>
            <QuestionChips questions={result.questions} />
        </div>
    );
};

export const QuestionsSkeleton = () => (
    <div className="-mx-4 flex gap-2 overflow-hidden px-4">
        {[140, 180, 120].map((w) => (
            <div key={w} className="h-10 shrink-0 animate-pulse rounded-full bg-surface" style={{ width: w }} />
        ))}
    </div>
);
