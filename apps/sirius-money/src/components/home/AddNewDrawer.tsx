"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { NotchedCard, SHEET_GAP_CLASS } from "@workspace/sirius-core/components/NotchedCard";
import { Button } from "@workspace/ui/components/button";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

interface AddNewDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPickGoal: () => void;
    onPickBudget: () => void;
}

export const AddNewDrawer = ({
    open,
    onOpenChange,
    onPickGoal,
    onPickBudget,
}: AddNewDrawerProps) => {
    const t = useT(homeDict);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                <Button
                    type="button"
                    aria-label={t.addNew.trigger}
                    className="h-[220px] w-10 shrink-0 bg-background hover:bg-background p-0"
                >
                    <div className="border-3 h-full w-full border-dashed border-border flex items-center justify-center rounded-xl hover:border-foreground transition-colors">
                        <Plus className="text-foreground" size={20} strokeWidth={3} />
                    </div>
                </Button>
            </DrawerTrigger>

            <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
                <NotchedCard closeLabel={t.addNew.close}>
                    <div className="w-full">
                        <div className="px-5 pb-5">
                            <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
                                {t.addNew.title}
                            </DrawerTitle>
                        </div>

                        <div className="px-4 grid grid-cols-2 gap-4 pb-[max(20px,calc(env(safe-area-inset-bottom)-4px))]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onPickGoal}
                                aria-label={t.addNew.goal}
                                className="relative aspect-square h-auto w-full p-0 rounded-4xl overflow-hidden bg-[#FFF3E0] hover:bg-[#FFE0B2] active:scale-[0.98] transition-all"
                            >
                                <Image
                                    src="/BlackHole.jpg"
                                    alt={t.addNew.goal}
                                    fill
                                    sizes="170px"
                                    className="object-cover"
                                />
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onPickBudget}
                                aria-label={t.addNew.budget}
                                className="relative aspect-square h-auto w-full p-0 rounded-4xl overflow-hidden bg-[#E3F2FD] hover:bg-[#BBDEFB] active:scale-[0.98] transition-all"
                            >
                                <video
                                    src="/butget.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </Button>
                        </div>
                    </div>
                </NotchedCard>
            </DrawerContent>
        </Drawer>
    );
};
