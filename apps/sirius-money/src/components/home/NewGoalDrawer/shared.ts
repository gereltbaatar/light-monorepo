import type { CreateGoalInput } from "@/app/_actions/goals";

export const inputClass =
    "h-12 px-4 rounded-2xl bg-surface text-foreground placeholder:text-muted-foreground/70 border-border";

export const selectTriggerClass =
    "h-12 w-full px-4 rounded-2xl bg-surface text-foreground border-border";

export const labelClass = "text-sm text-muted-foreground";

export const submitButtonClass =
    "w-full rounded-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90";

export interface GoalFormProps {
    onSubmitDone: (goalId?: string) => void;
}

export const numberOrUndefined = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

export const stringOrUndefined = (value: FormDataEntryValue | null) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

// Uploads the cover first so a failed upload never leaves a goal without its image.
export async function submitGoal(
    input: Omit<CreateGoalInput, "imageUrl">,
    image: File | null
) {
    let imageUrl: string | undefined;
    if (image) {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        imageUrl = await uploadToCloudinary(image);
    }
    const { createGoal } = await import("@/app/_actions/goals");
    return createGoal({ ...input, imageUrl });
}
