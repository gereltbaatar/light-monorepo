"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissToast, useToastQueue, type IslandToast, type ToastType } from "@/lib/toast";

const TYPES: Record<ToastType, { icon: LucideIcon; tint: string }> = {
    success: { icon: Check, tint: "bg-green-500" },
    error: { icon: X, tint: "bg-red-500" },
    warning: { icon: TriangleAlert, tint: "bg-orange-500" },
    info: { icon: Info, tint: "bg-blue-500" },
};

// Expand a beat after appearing, the way a Live Activity grows out of the island.
const EXPAND_DELAY_MS = 350;
const SWIPE_DISMISS_PX = -24;

// Always black in both themes, like the hardware cutout it imitates.
export const IslandToaster = () => {
    const queue = useToastQueue();
    const current = queue[0];

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3"
            style={{ paddingTop: "max(env(safe-area-inset-top), 10px)" }}
        >
            <AnimatePresence mode="wait">
                {current && <Island key={current.id} item={current} />}
            </AnimatePresence>

            <div className="sr-only" role="status" aria-live="polite">
                {current && current.type !== "error"
                    ? [current.title, current.description].filter(Boolean).join(". ")
                    : ""}
            </div>
            <div className="sr-only" role="alert">
                {current?.type === "error"
                    ? [current.title, current.description].filter(Boolean).join(". ")
                    : ""}
            </div>
        </div>
    );
};

const Island = ({ item }: { item: IslandToast }) => {
    const reduceMotion = useReducedMotion();
    const hasDetails = Boolean(item.description || item.action);
    const [expanded, setExpanded] = useState(false);
    // A tap to open holds the island until the user closes it.
    const [pinned, setPinned] = useState(false);
    const { icon: Icon, tint } = TYPES[item.type];

    useEffect(() => {
        if (!hasDetails) return;
        const timer = setTimeout(() => setExpanded(true), EXPAND_DELAY_MS);
        return () => clearTimeout(timer);
    }, [hasDetails]);

    useEffect(() => {
        if (pinned) return;
        const timer = setTimeout(() => dismissToast(item.id), item.duration);
        return () => clearTimeout(timer);
    }, [pinned, item.id, item.duration]);

    const spring = reduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, bounce: 0.35, duration: 0.5 };
    const swap = reduceMotion
        ? {}
        : {
              initial: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
              animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
              exit: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
          };

    return (
        <motion.div
            layout
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: -16, filter: "blur(6px)" }}
            transition={spring}
            style={{ borderRadius: 28 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.5, bottom: 0.05 }}
            onDragEnd={(_, info) => {
                if (info.offset.y < SWIPE_DISMISS_PX) dismissToast(item.id);
            }}
            onClick={() => {
                if (!hasDetails) return;
                setExpanded(!expanded);
                setPinned(!expanded);
            }}
            className={cn(
                "pointer-events-auto overflow-hidden bg-black text-white shadow-[0_14px_40px_-14px_rgb(0_0_0/0.7)] ring-1 ring-white/10",
                hasDetails && "cursor-pointer"
            )}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {expanded ? (
                    <motion.div
                        key="expanded"
                        {...swap}
                        transition={spring}
                        className="flex w-[min(92vw,380px)] items-center gap-3 p-2.5 pr-3"
                    >
                        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[13px]", tint)}>
                            <Icon className="size-[18px]" strokeWidth={2.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold leading-tight">{item.title}</p>
                            {item.description && (
                                <p className="line-clamp-2 pt-0.5 text-[13px] leading-snug text-white/55">
                                    {item.description}
                                </p>
                            )}
                        </div>
                        {item.action && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    item.action?.onClick();
                                    dismissToast(item.id);
                                }}
                                className="shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-white/25"
                            >
                                {item.action.label}
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="compact"
                        {...swap}
                        transition={spring}
                        className="flex h-10 max-w-[min(80vw,320px)] items-center gap-2.5 pl-2 pr-4"
                    >
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", tint)}>
                            <Icon className="size-3.5" strokeWidth={3} />
                        </span>
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
