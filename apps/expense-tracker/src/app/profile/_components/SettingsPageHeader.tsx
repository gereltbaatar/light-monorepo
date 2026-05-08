"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsPageHeaderProps {
    title: string;
}

export const SettingsPageHeader = ({ title }: SettingsPageHeaderProps) => {
    const router = useRouter();

    return (
        <header className="w-full">
            <div className="relative w-full px-4 py-6 flex items-center justify-center">
                <button
                    onClick={() => router.back()}
                    className="absolute left-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="Go back"
                >
                    <ChevronLeft color="#1C1C1E" size={30} />
                </button>
                {/* <Link
                    href="/"
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors absolute left-0"
                >
                    <ChevronLeft color="#1C1C1E" size={30} />
                </Link> */}
                <h1 className="text-2xl font-bold text-[#090909] tracking-tight">
                    {title}
                </h1>
            </div>
        </header>
    );
};
