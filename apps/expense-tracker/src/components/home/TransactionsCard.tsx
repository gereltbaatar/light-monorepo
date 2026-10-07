"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { TransactionsCardProps } from "./type";
import { moneyFormatter } from "../functions";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { categoryImage } from "@/lib/categories";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";

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
  category = "other",
  onEdit,
  onDelete,
  onOpen,
  cardId,
  isOpen,
  onSwipeOpen,
  onSwipeClose,
}: TransactionsCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const locale = useLocale();
  const categoryLabel = useT(categoriesDict)[category];
  const x = useMotionValue(0);

  // Extract time from timestamp (HH:MM format)
  const time = new Date(timestamp).toLocaleTimeString(INTL_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Transform x position to button opacity (fade in when swiping left)
  const buttonOpacity = useTransform(x, [-104, -52, 0], [1, 0.5, 0]);

  // Sync motion value to controlled `isOpen` from the parent. When another
  // card opens, this one snaps closed. Skipped while the user is actively
  // dragging this card so we don't fight the gesture.
  useEffect(() => {
    if (isDragging) return;
    const target = isOpen ? -104 : 0;
    const controls = animate(x, target, SNAP_TRANSITION);
    return () => controls.stop();
  }, [isOpen, isDragging, x]);

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    const shouldOpen = info.offset.x < -60;
    if (shouldOpen) {
      if (cardId) onSwipeOpen?.(cardId);
      else animate(x, -104, SNAP_TRANSITION);
    } else {
      if (cardId) onSwipeClose?.();
      else animate(x, 0, SNAP_TRANSITION);
    }
  };

  return (
    <div className="relative w-full rounded-full">
      {/* Action buttons background */}
      <motion.div
        style={{ opacity: buttonOpacity }}
        className="absolute right-0 top-0 bottom-0 flex items-center gap-2"
      >
        <motion.button
          onClick={() => onEdit?.()}
          className="w-11 h-11 rounded-full bg-surface flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <Pencil className="w-5 h-5 text-foreground" />
        </motion.button>
        <motion.button
          onClick={() => onDelete?.()}
          className="w-11 h-11 rounded-full bg-surface flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 className="w-5 h-5 text-foreground" />
        </motion.button>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -104, right: 0 }}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onTap={() => (isOpen ? onSwipeClose?.() : onOpen?.())}
        style={{ x }}
        className="relative w-full rounded-full bg-surface pl-2 pr-5 py-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-full bg-surface-2 flex items-center justify-center">
            <Image
              src={categoryImage(category)}
              alt={categoryLabel}
              width={26}
              height={26}
              className="w-[26px] h-[26px] object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {title}
            </h1>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {categoryLabel}
              </span>
              {time !== "00:00" && (
                <span className="text-[11px] text-muted-foreground">
                  {time}
                </span>
              )}
            </div>
          </div>

          <p
            className="shrink-0 text-[15px] font-semibold tabular-nums"
            style={{
              color: transactionType === "income" ? "#00b102" : "#ff0000",
            }}
          >
            {transactionType === "income" ? "+" : "-"}
            {moneyFormatter(Number(amount))}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
