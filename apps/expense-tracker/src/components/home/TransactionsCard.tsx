"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { TransactionsCardProps } from "./type";
import { moneyFormatter } from "../functions";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

// Stiff spring — quick snap with very little bounce.
const SNAP_TRANSITION = {
    type: "spring" as const,
    stiffness: 600,
    damping: 50,
    mass: 0.6,
} as const;

export const TransactionsCard = ({
    transactionType,
    title,
    amount,
    timestamp,
    onEdit,
    onDelete,
    cardId,
    isOpen,
    onSwipeOpen,
    onSwipeClose,
}: TransactionsCardProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Extract time from timestamp (HH:MM format)
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Transform x position to button opacity (fade in when swiping left)
    const buttonOpacity = useTransform(x, [-120, -60, 0], [1, 0.5, 0]);
    const buttonScale = useTransform(x, [-120, -60, 0], [1, 0.8, 0.5]);

    // Sync motion value to controlled `isOpen` from the parent. When another
    // card opens, this one snaps closed. Skipped while the user is actively
    // dragging this card so we don't fight the gesture.
    useEffect(() => {
        if (isDragging) return;
        const target = isOpen ? -120 : 0;
        const controls = animate(x, target, SNAP_TRANSITION);
        return () => controls.stop();
    }, [isOpen, isDragging, x]);

    const handleDragEnd = (_: any, info: any) => {
        setIsDragging(false);
        const shouldOpen = info.offset.x < -60;
        if (shouldOpen) {
            if (cardId) onSwipeOpen?.(cardId);
            else animate(x, -120, SNAP_TRANSITION);
        } else {
            if (cardId) onSwipeClose?.();
            else animate(x, 0, SNAP_TRANSITION);
        }
    };

    return (
        <div className="relative w-full rounded-[60px]">
            {/* Action buttons background */}
            <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2">
                <motion.button
                    // style={{ opacity: buttonOpacity, scale: buttonScale }}
                    onClick={() => onEdit?.()}
                    className="w-[52px] h-[52px] rounded-full bg-[#F8F9FA] flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                >
                    <Pencil className="w-5 h-5 text-[#1C1C1E]" />
                </motion.button>
                <motion.button
                    // style={{ opacity: buttonOpacity, scale: buttonScale }}
                    onClick={() => onDelete?.()}
                    className="w-[52px] h-[52px] rounded-full bg-[#F8F9FA] flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                >
                    <Trash2 className="w-5 h-5 text-[#1C1C1E]" />
                </motion.button>
            </div>

            {/* Swipeable card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative w-full rounded-[60px] bg-[#F8F9FA] p-2.5 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-2.5">
                    {/* icon */}
                    <div
                        className={`w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center `}
                        style={{ backgroundColor: transactionType === "income" ? "#e6fbe6" : "#fde6e6" }}
                    >
                        {transactionType === "income" ? (
                            <ArrowDown className="w-6 h-6 text-[#00b102]" />
                        ) : (
                            <ArrowUp className="w-6 h-6 text-[#ff0000]" />
                        )}
                    </div>

                    {/* title */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="w-full flex flex-col gap-0">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-lg font-bold text-[#1C1C1E]">{title}</h1>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-md font-bold" style={{ color: transactionType === "income" ? "#00b102" : "#ff0000" }}>
                                        {transactionType === "income" ? "+" : "-"} {moneyFormatter(Number(amount))}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-[#8E8E93] pr-2">{time}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};