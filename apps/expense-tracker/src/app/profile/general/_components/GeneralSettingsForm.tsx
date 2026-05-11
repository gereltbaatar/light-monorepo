"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
    updateAvatarUrl,
    updateDisplayName,
    type ProfileActionResult,
} from "@/app/_actions/profile";

interface GeneralSettingsFormProps {
    initialDisplayName: string;
    email: string;
    avatarUrl: string;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export const GeneralSettingsForm = ({
    initialDisplayName,
    email,
    avatarUrl,
}: GeneralSettingsFormProps) => {
    const [name, setName] = useState(initialDisplayName);
    const [avatar, setAvatar] = useState(avatarUrl);
    const [isUploading, startUpload] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-picking the same file
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please pick an image file");
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            toast.error("Image must be 2 MB or smaller");
            return;
        }

        startUpload(async () => {
            try {
                const url = await uploadToCloudinary(file);
                const result = await updateAvatarUrl(url);
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                setAvatar(url);
                toast.success("Profile picture updated");
            } catch (err) {
                toast.error(
                    err instanceof Error ? err.message : "Upload failed"
                );
            }
        });
    };

    return (
        <form action={formAction} className="w-full px-4 pt-2 space-y-6">
            {/* Avatar (clickable to change) */}
            <div className="flex flex-col items-center gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    aria-label="Change profile picture"
                    className="relative w-24 h-24 p-0 rounded-full bg-[#E9ECEF] overflow-hidden disabled:opacity-60 hover:bg-[#E9ECEF]"
                >
                    <Image
                        src={avatar}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="rounded-full"
                        unoptimized={avatar.startsWith("http")}
                    />
                    <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="w-6 h-6" />
                    </span>
                </Button>
                <p className="text-xs text-gray-400">
                    {isUploading ? "Uploading…" : "Tap photo to change"}
                </p>
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Name (editable) */}
            <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm text-gray-600">
                    Name
                </Label>
                <div className="relative">
                    <Input
                        id="display_name"
                        name="display_name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        maxLength={60}
                        className={cn(
                            "h-12 pl-4 pr-14 rounded-2xl",
                            "bg-[#F8F9FA] text-[#090909] placeholder:text-gray-400",
                            "border-gray-200 focus:border-gray-400",
                            "focus:ring-gray-300/50"
                        )}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isPending || isUnchanged}
                        aria-label="Save name"
                        className={cn(
                            "absolute right-1.5 top-1/2 -translate-y-1/2",
                            "h-9 w-18 rounded-xl",
                            "bg-[#090909] text-white hover:bg-[#1C1C1E]",
                            "disabled:opacity-30"
                        )}
                    >
                        <p className="text-sm font-semibold tracking-tight text-white">Save</p>
                    </Button>
                </div>
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

        </form>
    );
};
