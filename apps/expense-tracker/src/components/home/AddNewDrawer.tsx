"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";

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
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                <Button
                    type="button"
                    aria-label="Add goal or budget"
                    className="h-[220px] w-10 shrink-0 bg-white p-0"
                >
                    <div className="border-3 h-full w-full border-dashed border-[#DEE2E6] flex items-center justify-center rounded-xl hover:border-[#343A40] transition-colors">
                        <Plus color="#343A40" size={20} strokeWidth={3} />
                    </div>
                </Button>
            </DrawerTrigger>

            <DrawerContent className="bg-white border-0 rounded-t-[28px] *:first:hidden">
                <div className="mx-auto w-full max-w-[430px]">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-[#E5E5EA]" />
                    </div>

                    <div className="px-5 pt-4 pb-5">
                        <DrawerTitle className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
                            Add new
                        </DrawerTitle>
                    </div>

                    <div className="px-4 grid grid-cols-2 gap-4 pb-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onPickGoal}
                            aria-label="New goal"
                            className="relative w-[170px] h-[170px] p-0 rounded-4xl overflow-hidden bg-[#FFF3E0] hover:bg-[#FFE0B2] active:scale-[0.98] transition-all"
                        >
                            <Image
                                src="/BlackHole.jpg"
                                alt="New goal"
                                fill
                                sizes="170px"
                                className="object-cover"
                            />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onPickBudget}
                            aria-label="New budget"
                            className="relative w-[170px] h-[170px] p-0 rounded-4xl overflow-hidden bg-[#E3F2FD] hover:bg-[#BBDEFB] active:scale-[0.98] transition-all"
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
            </DrawerContent>
        </Drawer>
    );
};
