"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent } from "@workspace/ui/components/drawer";
import { toast } from "@/lib/toast";
import { NotchedCard, SHEET_GAP_CLASS } from "@/components/NotchedCard";
import { ScanStep } from "./ScanStep";
import { DetailsSheet } from "./DetailsSheet";
import { AnalyzingOverlay } from "./AnalyzingOverlay";
import type { ScannedDraft } from "./shared";
import { useT } from "@/lib/i18n/client";
import { useAiFeatures } from "@/lib/ai-features-client";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

type Step = "scan" | "analyzing" | "details";

// Vaul needs its exit animation to finish before the next drawer opens.
const DRAWER_TRANSITION_MS = 220;

interface ScanSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ScanSheet = ({ open, onOpenChange }: ScanSheetProps) => {
    const router = useRouter();
    const t = useT(scanDict);
    const aiFeatures = useAiFeatures();
    const [step, setStep] = useState<Step>("scan");
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [draft, setDraft] = useState<ScannedDraft | undefined>();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const after = (callback: () => void) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(callback, DRAWER_TRANSITION_MS);
    };

    const reset = () => {
        setStep("scan");
        setDetailsOpen(false);
        setDraft(undefined);
        setReceiptFile(null);
    };

    const close = () => {
        onOpenChange(false);
        reset();
    };

    /** Open the form with whatever we managed to read, so nothing is lost. */
    const fallBackToForm = (prefill?: ScannedDraft) => {
        setDraft(prefill);
        setStep("details");
        after(() => setDetailsOpen(true));
    };

    const handleCaptured = async (file: File) => {
        setReceiptFile(file);
        if (!aiFeatures.receipt) {
            fallBackToForm();
            return;
        }
        setStep("analyzing");

        const { parseReceipt } = await import("@/app/_actions/parse-receipt");
        const { saveTransaction } = await import("@/app/_actions/transactions");

        const body = new FormData();
        body.append("receipt", file);

        let parsed: Awaited<ReturnType<typeof parseReceipt>>;
        try {
            parsed = await parseReceipt(body);
        } catch (error) {
            console.error("[scan]", error);
            toast.error(
                error instanceof Error ? error.message : t.uploadFailed
            );
            fallBackToForm();
            return;
        }

        if ("error" in parsed) {
            toast.error(parsed.error);
            fallBackToForm();
            return;
        }

        const prefill: ScannedDraft = {
            title: parsed.merchant,
            amount: String(parsed.total),
            type: "expense",
            items: parsed.items,
            category: parsed.category,
        };

        // When the line items didn't reconcile, the read is suspect — show the
        // form so the user corrects it rather than silently banking a wrong number.
        if (!parsed.confident) {
            toast.warning(t.doubleCheck);
            fallBackToForm(prefill);
            return;
        }

        const result = await saveTransaction({
            type: "expense",
            title: parsed.merchant,
            amount: parsed.total,
            occurredAt: parsed.date ?? new Date().toISOString().slice(0, 10),
            items: parsed.items,
            category: parsed.category,
        });

        if ("error" in result) {
            toast.error(result.error);
            fallBackToForm(prefill);
            return;
        }

        toast.success(
            t.saved(parsed.total.toLocaleString(), parsed.merchant),
            {
                // The registered name confirms the TIN matched a real taxpayer.
                // It is shown as supporting detail, never as the title — the
                // registry often holds a holding company rather than the shop.
                description: parsed.registeredName
                    ? t.verified(parsed.registeredName)
                    : undefined,
                duration: 6000,
                action: {
                    label: t.edit,
                    onClick: () => {
                        onOpenChange(true);
                        fallBackToForm(prefill);
                    },
                },
            }
        );
        close();
        router.refresh();
    };

    return (
        <>
            <Drawer
                open={open && step !== "details"}
                // A scan in flight still saves, so the sheet stays until it resolves.
                dismissible={step !== "analyzing"}
                onOpenChange={(next) => {
                    if (!next && step !== "analyzing") close();
                }}
            >
                <DrawerContent
                    className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}
                >
                    <NotchedCard closeLabel={t.closeScanner} bleed>
                        <ScanStep
                            onCaptured={handleCaptured}
                            onEnterManually={() => {
                                setReceiptFile(null);
                                fallBackToForm();
                            }}
                            overlay={<AnalyzingOverlay open={step === "analyzing"} />}
                        />
                    </NotchedCard>
                </DrawerContent>
            </Drawer>

            <DetailsSheet
                open={open && detailsOpen}
                onOpenChange={(next) => {
                    if (next) return;
                    setDetailsOpen(false);
                    // Closing the form returns to the camera rather than leaving.
                    after(() => setStep("scan"));
                }}
                draft={draft}
                receiptFile={receiptFile}
                onSaved={() => {
                    close();
                    router.refresh();
                }}
            />
        </>
    );
};
