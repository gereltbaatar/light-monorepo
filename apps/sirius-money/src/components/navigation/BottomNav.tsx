"use client";

import { useState } from "react";
import Image from "next/image";
import { Home, TrendingUp, User, Plus, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { ScanSheet } from "@/components/scan/ScanSheet";
import { useT } from "@/lib/i18n/client";
import { useAiFeatures } from "@/lib/ai-features-client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const BottomNav = () => {
    const pathname = usePathname();
    const t = useT(homeDict);
    const aiFeatures = useAiFeatures();
    const [scanOpen, setScanOpen] = useState(false);

    const navItems = [
        { icon: Home, href: "/", label: t.nav.home },
        { icon: TrendingUp, href: "/stats", label: t.nav.stats },
        { icon: Sparkles, href: "/advisor", label: t.nav.advisor },
        { icon: User, href: "/profile", label: t.nav.profile },
    ].filter((item) => item.href !== "/advisor" || aiFeatures.advisor);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 px-4">
            <div className="w-full max-w-[430px] mx-auto flex items-center justify-between gap-3">
                {/* Main Navigation Pills */}
                <div className="relative h-18 bg-[#1C1C1E] rounded-full dark:ring-1 dark:ring-border px-2 py-2 flex items-center justify-around overflow-hidden">
                    {/* Navigation Items */}
                    <div className="relative z-10 w-full flex gap-2.5 items-center justify-around">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-label={item.label}
                                    className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="activeBackground"
                                            className="absolute -inset-1 rounded-full bg-white"
                                            transition={{
                                                type: "spring",
                                                stiffness: 280,
                                                damping: 25,
                                                mass: 0.6,
                                            }}
                                        />
                                    )}
                                    {/* Icon with animation */}
                                    <motion.div
                                        className="relative"
                                        animate={{
                                            scale: isActive ? 1 : 0.9,
                                            rotate: isActive ? [0, -5, 5, 0] : 0,
                                        }}
                                        transition={{
                                            scale: { duration: 0.2 },
                                            rotate: {
                                                duration: 0.5,
                                                ease: "easeInOut",
                                            },
                                        }}
                                    >
                                        <Icon
                                            className={`w-5 h-5 transition-colors duration-300 ${isActive
                                                ? "text-[#1C1C1E] drop-shadow-lg"
                                                : "text-gray-400"
                                                }`}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>

                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{
                            x: ["-100%", "200%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1,
                        }}
                    />
                </div>

                {/* Scan / add transaction, with voice entry floating above */}
                <div className="relative">
                    {aiFeatures.voice && (
                        <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2">
                            <VoiceButton />
                        </div>
                    )}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <button
                            type="button"
                            onClick={() => setScanOpen(true)}
                            aria-label={t.nav.scanReceipt}
                            className="w-18 h-18 bg-[#1C1C1E] rounded-full dark:ring-1 dark:ring-border flex items-center justify-center shadow-lg"
                        >
                            <Image src="/gemini.svg" alt="" width={34} height={34} unoptimized />
                        </button>
                    </motion.div>
                </div>
            </div>
            <ScanSheet open={scanOpen} onOpenChange={setScanOpen} />
        </div>
    );
};
