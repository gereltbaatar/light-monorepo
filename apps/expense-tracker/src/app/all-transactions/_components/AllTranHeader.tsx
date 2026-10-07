"use client";

import { ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { transactionsDict } from "@/lib/i18n/dictionaries/transactions";

export const AllTranHeader = () => {
    const t = useT(transactionsDict);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header when scrolling up or at the top
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setIsVisible(true);
            }
            // Hide header when scrolling down
            else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [lastScrollY]);

    return (
        <div
            className={`sticky top-0 bg-background z-40 px-4 py-4 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
                }`}
        >

            <div className="flex items-center justify-center gap-4 relative">
                <Link
                    href="/"
                    className="flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-surface-2 transition-colors absolute left-0"
                >
                    <ChevronLeft size={30} />
                </Link>
                <h1 className="text-2xl font-bold text-foreground">
                    {t.allTransactions}
                </h1>
                <div className="absolute right-0 text-foreground">
                    <Sparkles size={26} />
                </div>
            </div>
        </div>
    )
}