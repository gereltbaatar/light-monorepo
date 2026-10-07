"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { useT } from "@/lib/i18n/client";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

/**
 * Covers the camera while the receipt is read, so the last frame
 * is not left frozen on screen during the few-second wait.
 */
export const AnalyzingOverlay = ({ open }: { open: boolean }) => {
    const t = useT(scanDict);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm"
                >
                    <LoadingIndicator size={88} label={t.readingReceipt} colorful />

                    <p className="pt-6 text-base font-semibold text-white">
                        {t.readingReceiptEllipsis}
                    </p>
                    <p className="pt-1 text-sm text-white/60">
                        {t.takesSeconds}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
