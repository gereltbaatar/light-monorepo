"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { setLocale } from "@/app/_actions/locale";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { languageDict } from "@/lib/i18n/dictionaries/language";

export const LanguagePicker = () => {
    const router = useRouter();
    const current = useLocale();
    const t = useT(languageDict);
    const [isPending, startTransition] = useTransition();

    const choose = (locale: string) => {
        if (locale === current) return;
        startTransition(async () => {
            const result = await setLocale(locale);
            if ("error" in result) {
                toast.error(t.failed);
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="space-y-3">
            <div className="w-full bg-surface rounded-3xl overflow-hidden">
                {LOCALES.map((locale, index) => (
                    <div key={locale}>
                        <button
                            type="button"
                            onClick={() => choose(locale)}
                            disabled={isPending}
                            aria-pressed={current === locale}
                            className="w-full px-4 py-4 flex items-center justify-between h-[60px] cursor-pointer hover:bg-surface-2 active:bg-surface-2 transition-colors disabled:opacity-60"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 text-xs font-bold uppercase text-muted-foreground">
                                    {locale}
                                </span>
                                <p className="text-base font-medium text-foreground">{LOCALE_NAMES[locale]}</p>
                            </div>
                            {isPending && current !== locale ? null : current === locale ? (
                                <Check className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                            ) : null}
                        </button>
                        {index < LOCALES.length - 1 && <div className="h-px bg-border mx-4" />}
                    </div>
                ))}
            </div>
            <p className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.hint}
            </p>
        </div>
    );
};
