import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getAiUsageStats, USD_TO_MNT } from "@/lib/ai-usage";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { profileDict } from "@/lib/i18n/dictionaries/profile";

const tokens = (n: number) => n.toLocaleString("en-US");
const mnt = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US")}₮`;

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="flex flex-col gap-1 rounded-3xl bg-surface p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
);

export default async function AiUsagePage() {
    const stats = await getAiUsageStats();
    const locale = await getLocale();
    const { settings, aiUsage: t } = await getT(profileDict);
    const average = stats.scans ? stats.costMnt / stats.scans : 0;
    const totalTokens = stats.inputTokens + stats.outputTokens + stats.thinkingTokens;

    return (
        <div className="mx-auto w-full max-w-[430px] pb-28">
            <SettingsPageHeader title={settings.aiUsage} />

            <div className="flex flex-col gap-6 px-4 pt-2">
                {!stats.available ? (
                    <div className="rounded-3xl bg-surface p-6 text-center text-sm text-muted-foreground">
                        {t.notSetUp}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Stat label={t.thisMonth} value={mnt(stats.monthCostMnt)} hint={t.requests(stats.monthScans)} />
                            <Stat label={t.allTime} value={mnt(stats.costMnt)} hint={t.requests(stats.scans)} />
                            <Stat label={t.perRequest} value={mnt(average)} hint={t.average} />
                            <Stat label={t.tokens} value={tokens(totalTokens)} hint={t.tokensHint} />
                        </div>

                        <div className="rounded-3xl bg-surface p-4">
                            <h2 className="pb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {t.breakdown}
                            </h2>
                            {[
                                [t.input, stats.inputTokens],
                                [t.output, stats.outputTokens],
                                [t.thinking, stats.thinkingTokens],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between py-1.5 text-sm">
                                    <span className="text-foreground">{label}</span>
                                    <span className="font-medium text-foreground">{tokens(value as number)}</span>
                                </div>
                            ))}
                        </div>

                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {t.recent}
                            </h2>
                            {stats.recent.length === 0 ? (
                                <p className="rounded-3xl bg-surface p-6 text-center text-sm text-muted-foreground">
                                    {t.empty}
                                </p>
                            ) : (
                                <div className="overflow-hidden rounded-3xl bg-surface">
                                    {stats.recent.map((row) => (
                                        <div
                                            key={row.id}
                                            className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                                        >
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(row.createdAt).toLocaleString(INTL_LOCALE[locale], {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.tokenCount(tokens(row.inputTokens + row.outputTokens + row.thinkingTokens))}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{mnt(row.costMnt)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <p className="text-xs text-muted-foreground">
                            {t.costNote(USD_TO_MNT.toLocaleString("en-US"))} {t.freeTier}
                        </p>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
