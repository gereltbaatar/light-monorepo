"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { profileDict } from "@/lib/i18n/dictionaries/profile";

interface SettingsPageHeaderProps {
    title: string;
}

export const SettingsPageHeader = ({ title }: SettingsPageHeaderProps) => {
    const router = useRouter();
    const t = useT(profileDict);

    return (
        <header className="w-full">
            <div className="relative w-full px-4 py-6 flex items-center justify-center">
                <button
                    onClick={() => router.back()}
                    className="absolute left-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface active:bg-surface-2 transition-colors"
                    aria-label={t.goBack}
                >
                    <ChevronLeft className="text-foreground" size={30} />
                </button>
                {/* <Link
                    href="/"
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors absolute left-0"
                >
                    <ChevronLeft color="#1C1C1E" size={30} />
                </Link> */}
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {title}
                </h1>
            </div>
        </header>
    );
};
