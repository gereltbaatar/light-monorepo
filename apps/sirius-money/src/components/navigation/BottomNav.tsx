"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, Home, Keyboard, Mic, Sparkles, TrendingUp, User, X } from "lucide-react";
import { useAiFeatures } from "@workspace/sirius-core/components/AiSettingsProvider";
import { DetailsSheet } from "@/components/scan/DetailsSheet";
import { ScanSheet } from "@/components/scan/ScanSheet";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";
import { cn } from "@/lib/utils";

const SURFACE = "bg-[#1C1C1E] text-white shadow-lg dark:ring-1 dark:ring-border";
const ICON_BOX = "grid size-7 shrink-0 place-items-center";
// Item padding plus the menu's padding equals the button's, so every icon sits on one vertical line.
const MENU_ITEM =
    "group flex h-[52px] w-full items-center gap-2.5 whitespace-nowrap rounded-[14px] bg-white/[0.06] px-2.5 text-left text-[15px] font-semibold text-gray-300 ring-1 ring-white/[0.04] ring-inset transition-colors hover:bg-white/10 hover:text-white active:bg-white/15";
const BUBBLE =
    "grid size-8 shrink-0 place-items-center rounded-full bg-black/70 text-white transition-colors group-hover:bg-white group-hover:text-[#1C1C1E]";
const SPRING = "ease-[cubic-bezier(0.34,1.45,0.64,1)]";

export const BottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const t = useT(homeDict);
    const aiFeatures = useAiFeatures();
    const [open, setOpen] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);

    const navItems = [
        { icon: Home, href: "/", label: t.nav.home },
        { icon: TrendingUp, href: "/stats", label: t.nav.stats },
        { icon: Sparkles, href: "/advisor", label: t.nav.advisor },
        { icon: User, href: "/profile", label: t.nav.profile },
    ].filter((item) => item.href !== "/advisor" || aiFeatures.advisor);

    const menu = [
        aiFeatures.voice && (
            <VoiceButton key="say" className={MENU_ITEM}>
                <span className={BUBBLE}>
                    <Mic className="size-4" strokeWidth={2.2} />
                </span>
                {t.create.say}
            </VoiceButton>
        ),
        <button key="type" type="button" onClick={() => setManualOpen(true)} className={MENU_ITEM}>
            <span className={BUBBLE}>
                <Keyboard className="size-4" strokeWidth={2.2} />
            </span>
            {t.create.type}
        </button>,
        <button key="snap" type="button" onClick={() => setScanOpen(true)} className={MENU_ITEM}>
            <span className={BUBBLE}>
                <Camera className="size-4" strokeWidth={2.2} />
            </span>
            {t.create.snap}
        </button>,
    ].filter(Boolean) as React.ReactElement[];

    return (
        <>
            <button
                type="button"
                aria-hidden={!open}
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200",
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            />

            <div
                className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            >
                <div className="mx-auto flex w-full max-w-[430px] items-end justify-between gap-2.5">
                    <nav className={cn("flex h-14 shrink-0 items-center gap-1 rounded-[16px] p-2", SURFACE)}>
                        {navItems.map(({ icon: Icon, href, label }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setOpen(false)}
                                    aria-label={label}
                                    aria-current={isActive ? "page" : undefined}
                                    className="relative grid size-10 place-items-center rounded-[10px]"
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="activeBackground"
                                            className="absolute inset-0 rounded-[10px] bg-white"
                                            transition={{ type: "spring", stiffness: 280, damping: 25, mass: 0.6 }}
                                        />
                                    )}
                                    <Icon
                                        className={cn(
                                            "relative size-5 transition-colors duration-300",
                                            isActive ? "text-[#1C1C1E]" : "text-gray-400"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="relative w-[128px] shrink-0">
                        {/* Kept mounted while closed so the voice sheet survives the menu closing. */}
                        <div
                            id="create-menu"
                            onClickCapture={() => setOpen(false)}
                            className={cn(
                                "absolute inset-x-0 bottom-full mb-2.5 origin-bottom space-y-1.5 rounded-[20px] p-1.5 transition-all",
                                SURFACE,
                                open
                                    ? `translate-y-0 scale-100 opacity-100 duration-300 ${SPRING}`
                                    : "pointer-events-none translate-y-3 scale-90 opacity-0 duration-150 ease-in"
                            )}
                        >
                            {menu.map((item, i) => (
                                <div
                                    key={item.key}
                                    className={cn(
                                        "transition-all",
                                        open ? "translate-y-0 opacity-100 duration-300" : "translate-y-2 opacity-0 duration-100"
                                    )}
                                    style={{ transitionDelay: open ? `${(menu.length - i) * 45}ms` : "0ms" }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            aria-expanded={open}
                            aria-controls="create-menu"
                            className={cn(
                                "flex h-14 w-full items-center gap-3 rounded-[16px] px-[18px] text-[15px] font-semibold transition-[transform,background-color] duration-200 active:scale-95",
                                SURFACE,
                                open && "bg-[#2C2C2E]"
                            )}
                        >
                            <span className={cn(ICON_BOX, "relative")}>
                                <Image
                                    src="/gemini.svg"
                                    alt=""
                                    width={26}
                                    height={26}
                                    unoptimized
                                    className={cn(
                                        "absolute transition-all duration-300",
                                        SPRING,
                                        open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
                                    )}
                                />
                                <X
                                    className={cn(
                                        "absolute size-[26px] transition-all duration-300",
                                        SPRING,
                                        open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
                                    )}
                                    strokeWidth={2.5}
                                />
                            </span>
                            <span className="grid">
                                <span
                                    className={cn(
                                        "col-start-1 row-start-1 transition-all duration-200",
                                        open ? "-translate-y-1 opacity-0" : "opacity-100"
                                    )}
                                >
                                    {t.create.open}
                                </span>
                                <span
                                    className={cn(
                                        "col-start-1 row-start-1 transition-all duration-200",
                                        open ? "opacity-100" : "translate-y-1 opacity-0"
                                    )}
                                >
                                    {t.create.close}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <ScanSheet open={scanOpen} onOpenChange={setScanOpen} />
            <DetailsSheet
                open={manualOpen}
                onOpenChange={setManualOpen}
                receiptFile={null}
                onSaved={() => {
                    setManualOpen(false);
                    router.refresh();
                }}
            />
        </>
    );
};
