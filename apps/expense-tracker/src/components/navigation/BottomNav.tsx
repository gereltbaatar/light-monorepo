"use client";

import { Home, TrendingUp, User, Plus, QrCode } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const BottomNav = () => {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, href: "/", label: "Home" },
        { icon: TrendingUp, href: "/stats", label: "Stats" },
        { icon: User, href: "/profile", label: "Profile" },
    ];

    const activeIndex = navItems.findIndex((item) => item.href === pathname);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 px-4">
            <div className="w-full max-w-[430px] mx-auto flex items-center justify-between gap-3">
                {/* Main Navigation Pills */}
                <div className="relative h-18 bg-[#1C1C1E] rounded-full px-2 py-2 flex items-center justify-around overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeIndex !== -1 && (
                            <motion.div
                                key={activeIndex}
                                layoutId="activeBackground"
                                className="absolute w-[56px] h-[56px] bg-white rounded-full top-1/2 -translate-y-1/2"
                                initial={false}
                                animate={{
                                    left: activeIndex === 0 ? "6px" : activeIndex === 1 ? "calc(50% - 28px)" : "calc(100% - 60px)",
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 280,
                                    damping: 25,
                                    mass: 0.6,
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Navigation Items */}
                    <div className="relative z-10 w-full flex gap-2.5 items-center justify-around">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                                >
                                    {/* Icon with animation */}
                                    <motion.div
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

                {/* Plus Button with animation */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-18 h-18 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-lg"
                >
                    <QrCode className="w-8 h-8 text-white" strokeWidth={2} />
                </motion.button>
            </div>
        </div>
    );
};
