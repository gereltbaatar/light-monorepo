import { Suspense } from "react";
import { BottomNav } from "@/components/navigation";
import { getTransactions } from "@/lib/transactions";
import { buildSpendingSummary } from "@/lib/spending-summary";
import { AdvisorOrb } from "@/app/advisor/_components/AdvisorOrb";
import { SpendingStats } from "@/app/advisor/_components/SpendingStats";
import { AdviceSection, AdviceSkeleton } from "@/app/advisor/_components/AdviceSection";
import { QuestionsSection, QuestionsSkeleton } from "@/app/advisor/_components/QuestionsSection";
import { AdvisorChatProvider, ChatInput, ChatThread } from "@/app/advisor/_components/AdvisorChat";
import { getT } from "@/lib/i18n/server";
import { advisorDict } from "@/lib/i18n/dictionaries/advisor";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";
import { isAiFeatureEnabled } from "@/lib/ai-features-server";
import Link from "next/link";

const AdvisorPage = async () => {
    if (!(await isAiFeatureEnabled("advisor"))) {
        const off = await getT(aiFeaturesDict);
        return (
            <div className="min-h-screen bg-background pb-32">
                <div className="max-w-[430px] mx-auto px-4 pt-16 text-center">
                    <AdvisorOrb state="disabled" />
                    <h1 className="pt-8 text-2xl font-bold tracking-tight text-foreground">
                        {off.disabledTitle}
                    </h1>
                    <p className="pt-2 text-sm text-muted-foreground">{off.disabledBody}</p>
                    <Link
                        href="/profile/ai"
                        className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
                    >
                        {off.openSettings}
                    </Link>
                </div>
                <BottomNav />
            </div>
        );
    }

    const summary = buildSpendingSummary(await getTransactions(500));
    const t = await getT(advisorDict);

    return (
        <div className="min-h-screen bg-background pb-52">
            <div className="max-w-[430px] mx-auto px-4">
                <AdvisorChatProvider>
                    <div className="pt-8 pb-6 text-center">
                        <AdvisorOrb />
                        <p className="pt-6 text-sm text-muted-foreground">{t.greeting}</p>
                        <h1 className="pt-1 text-3xl font-bold tracking-tight text-foreground">
                            {t.heading}
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <SpendingStats summary={summary} />

                        <Suspense fallback={<AdviceSkeleton label={t.analyzing} />}>
                            <AdviceSection />
                        </Suspense>

                        <Suspense fallback={<QuestionsSkeleton />}>
                            <QuestionsSection />
                        </Suspense>

                        <ChatThread />
                    </div>

                    <ChatInput />
                </AdvisorChatProvider>
            </div>

            <BottomNav />
        </div>
    );
};

export default AdvisorPage;
