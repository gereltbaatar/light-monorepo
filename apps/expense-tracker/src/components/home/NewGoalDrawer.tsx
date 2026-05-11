"use client";

import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

interface NewGoalDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewGoalDrawer = ({ open, onOpenChange }: NewGoalDrawerProps) => {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-white border-0 rounded-t-[28px] *:first:hidden">
                <div className="mx-auto w-full max-w-[430px]">
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-[#E5E5EA]" />
                    </div>

                    <div className="px-5 pt-4 pb-5">
                        <DrawerTitle className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
                            Add new goal
                        </DrawerTitle>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onOpenChange(false);
                        }}
                        className="px-4 pb-8 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="goal_title" className="text-sm text-[#8E8E93]">
                                Title
                            </Label>
                            <Input
                                id="goal_title"
                                name="title"
                                type="text"
                                placeholder="New bicycle"
                                className="h-12 px-4 rounded-2xl bg-[#F8F9FA] text-[#090909] placeholder:text-gray-400 border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goal_amount" className="text-sm text-[#8E8E93]">
                                Target amount
                            </Label>
                            <Input
                                id="goal_amount"
                                name="target_amount"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                placeholder="1000000"
                                className="h-12 px-4 rounded-2xl bg-[#F8F9FA] text-[#090909] placeholder:text-gray-400 border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goal_date" className="text-sm text-[#8E8E93]">
                                Target date
                            </Label>
                            <Input
                                id="goal_date"
                                name="target_date"
                                type="date"
                                className="h-12 px-4 rounded-2xl bg-[#F8F9FA] text-[#090909] border-gray-200"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-full py-6 text-base font-semibold bg-[#090909] text-white hover:bg-[#1C1C1E]"
                        >
                            Create goal
                        </Button>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
