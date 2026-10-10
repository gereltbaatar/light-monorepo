"use client";

import { useCallback, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@workspace/ui/components/drawer";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { NotchedCard, SHEET_GAP_CLASS } from "@workspace/sirius-core/components/NotchedCard";
import { VoiceOrb, type OrbState } from "@workspace/sirius-core/components/VoiceOrb";
import { useAiFeatures, useVoiceOrbSettings } from "@workspace/sirius-core/components/AiSettingsProvider";
import { useVoiceRecorder } from "@workspace/sirius-core/lib/voice-recorder";
import { blobToWav } from "@workspace/sirius-core/lib/wav";
import { respondToWake } from "@workspace/sirius-core/lib/wake-response";
import { setWakeWordEnabled, useWakeWord, useWakeWordSetting } from "@workspace/sirius-core/lib/wake-word";
import { parseVoiceTasks, type ParsedVoice, type VoiceTask } from "@/app/_actions/parse-voice";
import { createTasks, deleteTask } from "@/app/_actions/tasks";
import { categoryName } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/locale";
import { timeRange } from "@/lib/time";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "listening" | "processing" | "confirm";

interface VoiceButtonProps {
  categories: Category[];
  /** Only one mounted button should listen for the wake word. */
  wakeWord?: boolean;
  className?: string;
}

export function VoiceButton({ categories, wakeWord = true, className }: VoiceButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("listening");
  const [draft, setDraft] = useState<ParsedVoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wake = useWakeWordSetting();
  const orbSettings = useVoiceOrbSettings();
  const features = useAiFeatures();

  const save = useCallback(
    async (voice: ParsedVoice) => {
      setIsSaving(true);
      try {
        const result = await createTasks(voice.tasks);
        if ("error" in result) {
          toast.error(result.error);
          setDraft(voice);
          setPhase("confirm");
          return;
        }
        setOpen(false);

        const { ids } = result;
        toast.success(voice.tasks.length === 1 ? voice.tasks[0]!.title : t.voice.savedMany(voice.tasks.length), {
          description: voice.heard ? `“${voice.heard}”` : undefined,
          duration: 6000,
          action: {
            label: t.voice.undo,
            onClick: () => void Promise.all(ids.map((id) => deleteTask(id))),
          },
        });
      } finally {
        setIsSaving(false);
      }
    },
    [t]
  );

  const handleAudio = useCallback(
    async (audio: Blob) => {
      setPhase("processing");
      try {
        const body = new FormData();
        body.append("audio", await blobToWav(audio), "voice.wav");
        const parsed = await parseVoiceTasks(body);

        if ("error" in parsed) {
          toast.error(parsed.error);
          setOpen(false);
          return;
        }
        if (!parsed.confident) {
          setDraft(parsed);
          setPhase("confirm");
          return;
        }
        await save(parsed);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.voice.processFailed);
        setOpen(false);
      }
    },
    [save, t]
  );

  const recorder = useVoiceRecorder(handleAudio);

  // Opening by tap waits for the mic button; only the wake word records hands-free.
  const begin = useCallback(() => {
    setDraft(null);
    setPhase("listening");
    setOpen(true);
  }, []);

  const beginFromWake = useCallback(async () => {
    setDraft(null);
    setPhase("listening");
    setOpen(true);
    setIsSpeaking(true);
    try {
      await respondToWake();
    } finally {
      setIsSpeaking(false);
    }
    void recorder.start();
  }, [recorder]);

  useWakeWord(beginFromWake, open || !wakeWord || !features.voice);

  const handleOpenChange = (next: boolean) => {
    if (!next) recorder.cancel();
    setOpen(next);
  };

  if (!features.voice) return null;

  const orbState: OrbState =
    phase === "processing"
      ? "thinking"
      : isSpeaking
        ? "speaking"
        : recorder.state === "recording"
          ? "listening"
          : recorder.error
            ? "error"
            : "idle";

  return (
    <>
      <button
        type="button"
        onClick={begin}
        aria-label={t.voice.addByVoice}
        className={cn(
          "relative flex size-13 items-center justify-center rounded-full bg-[#1C1C1E] text-white shadow-lg transition-transform active:scale-[0.92] dark:ring-1 dark:ring-border",
          className
        )}
      >
        <Mic className="size-5" strokeWidth={2.2} />
        {wakeWord && wake.enabled && wake.supported && (
          <span className="absolute top-1 right-1 size-2.5 rounded-full bg-green-500 ring-2 ring-[#1C1C1E]" />
        )}
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
          <NotchedCard closeLabel={t.voice.close}>
            <div className="w-full px-5 pt-0 pb-[max(20px,calc(env(safe-area-inset-bottom)-4px))]">
              <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
                {phase === "confirm" ? t.voice.checkAndSave : t.voice.sayTasks}
              </DrawerTitle>

              {phase !== "confirm" && (
                <>
                  <p className="min-h-5 text-center text-sm text-muted-foreground">
                    {phase === "processing"
                      ? t.voice.understanding
                      : recorder.error && (recorder.error === "mic-denied" ? t.voice.micDenied : t.voice.micFailed)}
                  </p>

                  <div className="flex justify-center pt-1 pb-4">
                    <VoiceOrb
                      state={orbState}
                      levelRef={orbSettings.mic ? recorder.levelRef : undefined}
                      label={t.orb.label}
                    />
                  </div>

                  <div className="flex justify-center">
                    {phase === "processing" ? (
                      // Holds the button's height so the sheet doesn't jump.
                      <div className="h-14" aria-hidden />
                    ) : recorder.state === "recording" ? (
                      <button
                        type="button"
                        onClick={recorder.stop}
                        aria-label={t.voice.stopRecording}
                        className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <Square className="size-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void recorder.start()}
                        aria-label={t.voice.startRecording}
                        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <Mic className="size-5" />
                      </button>
                    )}
                  </div>
                </>
              )}

              {phase === "confirm" && draft && (
                <ConfirmForm
                  draft={draft}
                  categories={categories}
                  isSaving={isSaving}
                  onChange={setDraft}
                  onSave={() => void save(draft)}
                  onRetry={begin}
                />
              )}

              {wake.supported && (
                <label className="mt-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5">
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{t.voice.listenFor}</span>
                    <span className="block text-xs text-muted-foreground">{t.voice.listenHint}</span>
                  </span>
                  <Switch checked={wake.enabled} onCheckedChange={setWakeWordEnabled} />
                </label>
              )}
            </div>
          </NotchedCard>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function ConfirmForm({
  draft,
  categories,
  isSaving,
  onChange,
  onSave,
  onRetry,
}: {
  draft: ParsedVoice;
  categories: Category[];
  isSaving: boolean;
  onChange: (next: ParsedVoice) => void;
  onSave: () => void;
  onRetry: () => void;
}) {
  const { locale, t } = useI18n();
  const { tasks } = draft;
  const valid = tasks.length > 0 && tasks.every((task) => task.title.trim());

  const update = (index: number, next: VoiceTask) =>
    onChange({ ...draft, tasks: tasks.map((task, i) => (i === index ? next : task)) });
  const remove = (index: number) => onChange({ ...draft, tasks: tasks.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3 pt-4">
      {draft.heard && (
        <p className="rounded-2xl bg-surface px-4 py-3 text-sm italic text-muted-foreground">“{draft.heard}”</p>
      )}

      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {tasks.map((task, index) => {
          const category = categories.find((c) => c.id === task.categoryId);
          const details = [
            task.dueDate && formatDate(task.dueDate, { weekday: "short", month: "short", day: "numeric" }, locale),
            (task.dueTime || task.durationMinutes) && timeRange(task.dueTime, task.durationMinutes, t.duration),
            task.priority !== "medium" && t.priority[task.priority],
            category && categoryName(category, t),
          ].filter(Boolean);

          return (
            <div key={index} className="space-y-1.5 rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={task.title}
                  onChange={(e) => update(index, { ...task, title: e.target.value })}
                  placeholder={t.voice.titlePlaceholder}
                  className="h-10 rounded-xl bg-background"
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t.voice.removeTask}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {details.length > 0 && <p className="px-1 text-xs text-muted-foreground">{details.join(" · ")}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button type="button" onClick={onRetry} className="h-12 rounded-full bg-surface text-sm font-semibold">
          {t.voice.sayAgain}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !valid}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {tasks.length > 1 ? t.voice.saveCount(tasks.length) : t.voice.save}
        </button>
      </div>
    </div>
  );
}
