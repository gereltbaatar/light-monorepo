"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    updateDisplayName,
    type ProfileActionResult,
} from "@/app/_actions/profile";

interface GeneralSettingsFormProps {
    initialDisplayName: string;
    email: string;
    avatarUrl: string;
}

export const GeneralSettingsForm = ({
    initialDisplayName,
    email,
    avatarUrl,
}: GeneralSettingsFormProps) => {
    const [name, setName] = useState(initialDisplayName);

    const [state, formAction, isPending] = useActionState<
        ProfileActionResult | undefined,
        FormData
    >(updateDisplayName, undefined);

    useEffect(() => {
        if (!state) return;
        if ("error" in state) {
            toast.error(state.error);
        } else {
            toast.success("Profile updated");
        }
    }, [state]);

    const isUnchanged = name.trim() === initialDisplayName.trim();

    return (
        <form action={formAction} className="w-full px-4 pt-2 space-y-6">
            {/* Avatar (read-only) */}
            <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-[#E9ECEF] overflow-hidden">
                    <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="rounded-full"
                        unoptimized={avatarUrl.startsWith("http")}
                    />
                </div>
            </div>

            {/* Name (editable) */}
            <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm text-gray-600">
                    Name
                </Label>
                <Input
                    id="display_name"
                    name="display_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    className={cn(
                        "h-12 px-4 rounded-2xl",
                        "bg-[#F8F9FA] text-[#090909] placeholder:text-gray-400",
                        "border-gray-200 focus:border-gray-400",
                        "focus:ring-gray-300/50"
                    )}
                />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-600">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className={cn(
                        "h-12 px-4 rounded-2xl",
                        "bg-[#F1F3F5] text-gray-500",
                        "border-gray-200",
                        "disabled:opacity-100 disabled:cursor-not-allowed"
                    )}
                />
                <p className="text-xs text-gray-400 px-1">
                    Email cannot be changed.
                </p>
            </div>

            {/* Save */}
            <Button
                type="submit"
                disabled={isPending || isUnchanged}
                className={cn(
                    "w-full rounded-full py-6 text-base font-semibold",
                    "bg-[#090909] text-white hover:bg-[#1C1C1E]",
                    "disabled:opacity-40"
                )}
            >
                {isPending ? "Saving…" : "Save changes"}
            </Button>
        </form>
    );
};
