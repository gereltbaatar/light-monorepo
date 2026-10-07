"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { AspectRatio } from "@workspace/ui/components/aspect-ratio";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { useT } from "@/lib/i18n/client";
import { goalsDict } from "@/lib/i18n/dictionaries/goals";
import { labelClass } from "./shared";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface GoalImagePickerProps {
    file: File | null;
    onChange: (file: File | null) => void;
}

export const GoalImagePicker = ({ file, onChange }: GoalImagePickerProps) => {
    const t = useT(goalsDict);
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrl = useMemo(
        () => (file ? URL.createObjectURL(file) : null),
        [file]
    );

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const picked = event.target.files?.[0];
        event.target.value = "";
        if (!picked) return;
        if (!picked.type.startsWith("image/")) {
            toast.error(t.pickImageFile);
            return;
        }
        if (picked.size > MAX_IMAGE_BYTES) {
            toast.error(t.imageTooLarge);
            return;
        }
        onChange(picked);
    };

    return (
        <div className="space-y-2">
            <Label className={labelClass}>{t.coverImage}</Label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handlePick}
                className="hidden"
            />
            <AspectRatio ratio={16 / 9}>
                {previewUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-2xl">
                        <Image
                            src={previewUrl}
                            alt={t.coverPreviewAlt}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={() => onChange(null)}
                            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 text-black hover:bg-white"
                            aria-label={t.removeImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2"
                    >
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-sm font-medium">{t.addPhoto}</span>
                    </button>
                )}
            </AspectRatio>
        </div>
    );
};
