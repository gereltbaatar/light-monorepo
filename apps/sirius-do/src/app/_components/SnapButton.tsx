"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@workspace/ui/components/drawer";
import { NotchedCard, SHEET_GAP_CLASS } from "@workspace/sirius-core/components/NotchedCard";
import { useAiFeatures } from "@workspace/sirius-core/components/AiSettingsProvider";
import { parseImageTasks } from "@/app/_actions/parse-image";
import type { ParsedVoice } from "@/app/_actions/parse-voice";
import { createTasks, deleteTask } from "@/app/_actions/tasks";
import { useI18n } from "@/lib/i18n/client";
import { toast } from "@/lib/toast";
import type { Category } from "@/lib/types";
import { ConfirmForm } from "./VoiceButton";

const MAX_EDGE = 1600;

// Phone photos run to several MB; a 1600px JPEG reads just as well and uploads fast.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

interface SnapButtonProps {
  categories: Category[];
  className?: string;
  children: React.ReactNode;
}

export function SnapButton({ categories, className, children }: SnapButtonProps) {
  const { t } = useI18n();
  const features = useAiFeatures();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<ParsedVoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pick = () => inputRef.current?.click();

  async function read(file: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setDraft(null);
    setOpen(true);

    try {
      const body = new FormData();
      body.append("image", await shrink(file), "snap.jpg");
      const parsed = await parseImageTasks(body);
      if ("error" in parsed) {
        toast.error(parsed.error);
        setOpen(false);
        return;
      }
      setDraft(parsed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.snap.readFailed);
      setOpen(false);
    }
  }

  async function save(result: ParsedVoice) {
    setIsSaving(true);
    try {
      const saved = await createTasks(result.tasks);
      if ("error" in saved) {
        toast.error(saved.error);
        return;
      }
      setOpen(false);
      const { ids } = saved;
      toast.success(result.tasks.length === 1 ? result.tasks[0]!.title : t.voice.savedMany(result.tasks.length), {
        description: result.heard || undefined,
        duration: 6000,
        action: { label: t.voice.undo, onClick: () => void Promise.all(ids.map((id) => deleteTask(id))) },
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!features.voice) return null;

  return (
    <>
      <button type="button" onClick={pick} aria-label={t.snap.addBySnap} className={className}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void read(file);
        }}
      />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
          <NotchedCard closeLabel={t.voice.close}>
            <div className="w-full px-5 pt-0 pb-[max(20px,calc(env(safe-area-inset-bottom)-4px))]">
              <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
                {draft ? t.voice.checkAndSave : t.snap.reading}
              </DrawerTitle>

              {!draft && preview && (
                <div className="relative mt-4 overflow-hidden rounded-2xl bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL, nothing for next/image to optimize */}
                  <img src={preview} alt="" className="max-h-72 w-full object-contain opacity-60" />
                  <div className="absolute inset-x-0 top-0 h-1/3 animate-pulse bg-gradient-to-b from-white/20 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
                      <Loader2 className="size-4 animate-spin" />
                      {t.snap.reading}
                    </span>
                  </div>
                </div>
              )}

              {draft && (
                <ConfirmForm
                  draft={draft}
                  categories={categories}
                  isSaving={isSaving}
                  onChange={setDraft}
                  onSave={() => void save(draft)}
                  onRetry={pick}
                  retryLabel={t.snap.retake}
                />
              )}
            </div>
          </NotchedCard>
        </DrawerContent>
      </Drawer>
    </>
  );
}
