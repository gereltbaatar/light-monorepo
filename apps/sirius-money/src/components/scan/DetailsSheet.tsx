"use client";

import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { ManualEntryForm } from "./ManualEntryForm";
import type { ScannedDraft } from "./shared";
import { useT } from "@/lib/i18n/client";
import { scanDict } from "@/lib/i18n/dictionaries/scan";

interface DetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Values read off a scanned receipt, when the scan produced any. */
    draft?: ScannedDraft;
    receiptFile: File | null;
    onSaved: () => void;
}

export const DetailsSheet = ({
    open,
    onOpenChange,
    draft,
    receiptFile,
    onSaved,
}: DetailsSheetProps) => {
    const t = useT(scanDict);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-0 dark:border-t dark:border-border rounded-t-[28px] *:first:hidden">
                <div className="mx-auto w-full max-w-[430px]">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-surface-2" />
                    </div>

                    <div className="px-5 pt-4 pb-4">
                        <DrawerTitle className="text-2xl font-bold text-foreground tracking-tight">
                            {t.addTransaction}
                        </DrawerTitle>
                    </div>

                    <ManualEntryForm
                        draft={draft}
                        receiptFile={receiptFile}
                        onSaved={onSaved}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
};
