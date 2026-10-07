"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mic, Square, X } from "lucide-react";
import { VoiceOrb, type OrbState } from "@/components/voice-orbs/VoiceOrb";
import { useVoiceOrbSettings } from "@/lib/voice-orb-client";
import { toast } from "@/lib/toast";
import { Drawer, DrawerContent, DrawerTitle } from "@workspace/ui/components/drawer";
import { NotchedCard, SHEET_GAP_CLASS } from "@/components/NotchedCard";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@/lib/utils";
import { parseVoiceTransaction, type ParsedVoice, type VoiceEntry } from "@/app/_actions/parse-voice";
import { deleteTransaction, saveTransactions } from "@/app/_actions/transactions";
import { useT } from "@/lib/i18n/client";
import { voiceDict } from "@/lib/i18n/dictionaries/voice";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { moneyFormatter } from "@/components/functions";
import { blobToWav } from "./wav";
import { respondToWake } from "./wakeResponse";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { setWakeWordEnabled, useWakeWord, useWakeWordSetting } from "./useWakeWord";

type Phase = "listening" | "processing" | "confirm";

const localToday = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const signed = (entry: VoiceEntry) =>
    `${entry.type === "income" ? "+" : "-"}${moneyFormatter(entry.amount)}`;

export const VoiceButton = () => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [phase, setPhase] = useState<Phase>("listening");
    const [draft, setDraft] = useState<ParsedVoice | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const wake = useWakeWordSetting();
    const orbSettings = useVoiceOrbSettings();
    const t = useT(voiceDict);

    const save = useCallback(
        async (voice: ParsedVoice) => {
            const { entries } = voice;
            setIsSaving(true);
            try {
                const result = await saveTransactions(
                    entries.map((entry) => ({
                        type: entry.type,
                        title: entry.title,
                        amount: entry.amount,
                        occurredAt: entry.date,
                        category: entry.category,
                        items: entry.items,
                    }))
                );
                if ("error" in result) {
                    toast.error(result.error);
                    setDraft(voice);
                    setPhase("confirm");
                    return;
                }
                setOpen(false);
                router.refresh();

                const ids = result.ids;
                const undo = ids.length
                    ? {
                          label: t.undo,
                          onClick: async () => {
                              const results = await Promise.all(ids.map((id) => deleteTransaction(id)));
                              const failed = results.find((r) => "error" in r);
                              if (failed && "error" in failed) toast.error(failed.error);
                              router.refresh();
                          },
                      }
                    : undefined;

                if (entries.length === 1) {
                    const [entry] = entries;
                    toast.success(`${signed(entry)} · ${entry.title}`, {
                        description: entry.items.length
                            ? t.itemsSaved(entry.items.length)
                            : voice.heard
                              ? `“${voice.heard}”`
                              : undefined,
                        duration: 6000,
                        action: undo,
                    });
                    return;
                }
                toast.success(t.savedMany(entries.length), {
                    description: entries.map((entry) => `${entry.title} ${signed(entry)}`).join(" · "),
                    duration: 6000,
                    action: undo,
                });
            } finally {
                setIsSaving(false);
            }
        },
        [router, t]
    );

    const handleAudio = useCallback(
        async (audio: Blob) => {
            setPhase("processing");
            try {
                const body = new FormData();
                body.append("audio", await blobToWav(audio), "voice.wav");
                body.append("today", localToday());
                const parsed = await parseVoiceTransaction(body);

                if ("error" in parsed) {
                    toast.error(parsed.error);
                    setOpen(false);
                    return;
                }
                // One unclear entry holds the whole batch, so nothing half-saves behind the user's back.
                if (parsed.entries.some((entry) => !entry.confident)) {
                    setDraft(parsed);
                    setPhase("confirm");
                    return;
                }
                await save(parsed);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : t.processFailed);
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

    useWakeWord(beginFromWake, open);

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

    const handleOpenChange = (next: boolean) => {
        if (!next) recorder.cancel();
        setOpen(next);
    };

    return (
        <>
            <motion.button
                type="button"
                onClick={begin}
                whileTap={{ scale: 0.92 }}
                aria-label={t.addByVoice}
                className="relative flex h-13 w-13 items-center justify-center rounded-full bg-[#1C1C1E] text-white shadow-lg dark:ring-1 dark:ring-border"
            >
                <Mic className="h-5 w-5" strokeWidth={2.2} />
                {wake.enabled && wake.supported && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[#1C1C1E]" />
                )}
            </motion.button>

            <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerContent className={`${SHEET_GAP_CLASS} mx-auto max-w-[406px] border-0 bg-transparent *:first:hidden`}>
                    <NotchedCard closeLabel={t.close}>
                        <div className="w-full px-5 pb-[max(20px,calc(env(safe-area-inset-bottom)-4px))] pt-0">
                            <DrawerTitle className="text-center text-xl font-bold tracking-tight text-foreground">
                                {phase === "confirm" ? t.checkAndSave : t.saySpent}
                            </DrawerTitle>

                            {phase !== "confirm" && (
                                <>
                                    <p className="min-h-5 text-center text-sm text-muted-foreground">
                                        {phase === "processing" ? t.understanding : recorder.error}
                                    </p>

                                    <div className="flex justify-center pb-4 pt-1">
                                        <VoiceOrb
                                            state={orbState}
                                            levelRef={orbSettings.mic ? recorder.levelRef : undefined}
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
                                                aria-label={t.stopRecording}
                                                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white"
                                            >
                                                <Square className="h-5 w-5 fill-current" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => void recorder.start()}
                                                aria-label={t.startRecording}
                                                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                            >
                                                <Mic className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {phase === "confirm" && draft && (
                                <ConfirmForm
                                    draft={draft}
                                    isSaving={isSaving}
                                    onChange={setDraft}
                                    onSave={() => void save(draft)}
                                    onRetry={begin}
                                />
                            )}

                            {wake.supported && (
                                <label className="mt-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5">
                                    <span>
                                        <span className="block text-sm font-semibold text-foreground">
                                            {t.listenFor}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {t.listenHint}
                                        </span>
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
};

const ConfirmForm = ({
    draft,
    isSaving,
    onChange,
    onSave,
    onRetry,
}: {
    draft: ParsedVoice;
    isSaving: boolean;
    onChange: (next: ParsedVoice) => void;
    onSave: () => void;
    onRetry: () => void;
}) => {
    const t = useT(voiceDict);
    const { entries } = draft;
    const valid = entries.length > 0 && entries.every((e) => e.title.trim() && e.amount > 0);

    const update = (index: number, next: VoiceEntry) =>
        onChange({ ...draft, entries: entries.map((e, i) => (i === index ? next : e)) });
    const remove = (index: number) =>
        onChange({ ...draft, entries: entries.filter((_, i) => i !== index) });

    return (
        <div className="space-y-3 pt-4">
            {draft.heard && (
                <p className="rounded-2xl bg-surface px-4 py-3 text-sm italic text-muted-foreground">
                    “{draft.heard}”
                </p>
            )}

            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
                {entries.map((entry, index) => (
                    <EntryCard
                        key={index}
                        entry={entry}
                        onChange={(next) => update(index, next)}
                        onRemove={entries.length > 1 ? () => remove(index) : undefined}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                    type="button"
                    onClick={onRetry}
                    className="h-12 rounded-full bg-surface text-sm font-semibold text-foreground"
                >
                    {t.sayAgain}
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || !valid}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {entries.length > 1 ? t.saveCount(entries.length) : t.save}
                </button>
            </div>
        </div>
    );
};

const EntryCard = ({
    entry,
    onChange,
    onRemove,
}: {
    entry: VoiceEntry;
    onChange: (next: VoiceEntry) => void;
    onRemove?: () => void;
}) => {
    const t = useT(voiceDict);
    const categories = useT(categoriesDict);
    const needsAmount = !(entry.amount > 0);

    return (
        <div className={cn("space-y-2 rounded-3xl bg-surface p-3", needsAmount && "ring-2 ring-orange-500/60")}>
            <div className="flex items-center gap-2">
                <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl bg-background p-1">
                    {(["expense", "income"] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onChange({ ...entry, type })}
                            className={cn(
                                "rounded-xl py-1.5 text-xs font-semibold",
                                entry.type === type ? "bg-surface-2 text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {t[type]}
                        </button>
                    ))}
                </div>
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={t.removeEntry}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {entry.items.length > 0 && (
                <ul className="divide-y divide-border rounded-2xl bg-background px-3">
                    {entry.items.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="flex justify-between gap-3 py-2 text-sm">
                            <span className="min-w-0 truncate text-foreground">
                                {item.quantity > 1 ? `${item.quantity} × ` : ""}
                                {item.name}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                                {moneyFormatter(item.total)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <Input
                value={entry.title}
                onChange={(e) => onChange({ ...entry, title: e.target.value })}
                placeholder={t.titlePlaceholder}
                className="h-11 rounded-2xl bg-background"
            />
            <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={entry.amount || ""}
                onChange={(e) => onChange({ ...entry, amount: Number(e.target.value) })}
                placeholder={t.amountPlaceholder}
                autoFocus={needsAmount}
                className="h-11 rounded-2xl bg-background"
            />
            <p className="px-1 text-xs text-muted-foreground">
                {categories[entry.category]} · {entry.date}
            </p>
        </div>
    );
};
