"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

export const Bank = () => {
    const t = useT(homeDict);

    return (
        <div className="w-full px-4 pt-4">
            <div className="relative w-full h-[150px] bg-[#1C1C1E] rounded-3xl overflow-hidden dark:ring-1 dark:ring-border">
                {/* Content */}
                <div className="relative z-10 w-full h-full px-5 py-5 flex flex-col justify-between">
                    {/* Text Content */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            {t.bank.title}
                        </h2>
                        <h2 className="text-xl font-bold text-white">
                            {t.bank.subtitle}
                        </h2>
                    </div>

                    {/* Share Button */}
                    <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full w-fit">
                        <span className="text-sm text-white/70 font-medium">
                            {t.bank.cta}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                {/* Floating Animated Bank Logos */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Khan Bank - Top Right */}
                    <motion.div
                        className="absolute top-3 right-16 w-14 h-14"
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="rounded-xl overflow-hidden">
                            <Image
                                src="/khaan-bank.png"
                                alt="Khan Bank"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* Has Bank - Right Middle */}
                    <motion.div
                        className="absolute top-16 right-4 w-13 h-13"
                        animate={{
                            y: [0, -15, 0],
                            rotate: [0, -5, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5,
                        }}
                    >
                        <div className="rounded-xl overflow-hidden">
                            <Image
                                src="/hasbank.png"
                                alt="Has Bank"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* M Bank - Bottom Right */}
                    <motion.div
                        className="absolute bottom-2 right-19 w-14 h-14"
                        animate={{
                            y: [0, -12, 0],
                            rotate: [0, 8, 0],
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                    >
                        <div className="rounded-xl overflow-hidden">
                            <Image
                                src="/mbank.jpg"
                                alt="M Bank"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
