"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { TransactionsCardProps } from "./type";
import { moneyFormatter } from "../functions";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";

export const TransactionsCard = ({ transactionType, title, amount, timestamp, onEdit, onDelete }: TransactionsCardProps) => {
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

    const handleDragEnd = (_: any, info: any) => {
        setIsDragging(false);
        // If dragged more than 60px to the left, keep buttons visible
        if (info.offset.x < -60) {
            x.set(-120);
        } else {
            x.set(0);
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
                dragElastic={0.05}
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