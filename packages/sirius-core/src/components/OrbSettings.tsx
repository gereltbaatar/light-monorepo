"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import {
    COLOR_PRESETS,
    DEFAULT_VOICE_ORB,
    ORBS,
    ORB_IDS,
    SIZE_OPTIONS,
    SPEED_OPTIONS,
    resolveOrbColors,
    type OrbTech,
    type VoiceOrbSettings,
} from "../lib/voice-orb";
import { useAudioLevel } from "../voice-orbs/lib/use-audio-level";
import { useVoiceOrbSettings } from "./AiSettingsProvider";
import { VoiceOrb } from "./VoiceOrb";

export interface OrbSettingsLabels {
    description: string;
    states: Record<PreviewState, string>;
    micTest: string;
    micTestHint: string;
    micDenied: string;
    micUnavailable: string;
    style: string;
    tech: Record<OrbTech, string>;
    colors: string;
    orbDefault: string;
    custom: string;
    from: string;
    to: string;
    speed: string;
    speeds: Record<"0.5" | "1" | "1.5" | "2", string>;
    size: string;
    sizes: Record<"128" | "168" | "208", string>;
    micReactive: string;
    micReactiveHint: string;
    reset: string;
    saveFailed: string;
    label: string;
}

interface OrbSettingsProps {
    labels: OrbSettingsLabels;
    onSave: (settings: VoiceOrbSettings) => Promise<{ error: string } | { ok: true }>;
    onError: (message: string) => void;
}

type PreviewState = "idle" | "listening" | "thinking" | "speaking";

const PREVIEW_STATES: PreviewState[] = ["idle", "listening", "thinking", "speaking"];
const SAVE_DEBOUNCE_MS = 400;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">{title}</h2>
        {children}
    </section>
);

const Segmented = <T extends string | number>({
    options,
    value,
    label,
    onChange,
}: {
    options: readonly T[];
    value: T;
    label: (option: T) => string;
    onChange: (option: T) => void;
}) => (
    <div
        className="grid gap-1 rounded-2xl bg-surface p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
        {options.map((option) => (
            <button
                key={String(option)}
                type="button"
                onClick={() => onChange(option)}
                aria-pressed={option === value}
                className={cn(
                    "rounded-xl py-2.5 text-sm font-semibold transition-colors",
                    option === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
            >
                {label(option)}
            </button>
        ))}
    </div>
);

export const OrbSettings = ({ labels: t, onSave, onError }: OrbSettingsProps) => {
    const saved = useVoiceOrbSettings();
    const [draft, setDraft] = useState<VoiceOrbSettings>(saved);
    const [previewState, setPreviewState] = useState<PreviewState>("listening");
    const [micTest, setMicTest] = useState(false);
    const [, startTransition] = useTransition();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { levelRef, error: micError } = useAudioLevel(micTest);

    useEffect(() => {
        if (micError) onError(micError === "permission-denied" ? t.micDenied : t.micUnavailable);
    }, [micError, onError, t]);

    const micOn = micTest && !micError;

    // The hook only retries when `active` goes false then true again.
    const toggleMic = (on: boolean) => {
        if (on && micError) {
            setMicTest(false);
            requestAnimationFrame(() => setMicTest(true));
            return;
        }
        setMicTest(on);
    };

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    // Color pickers fire on every drag step, so writes are coalesced.
    const update = (patch: Partial<VoiceOrbSettings>) => {
        const next = { ...draft, ...patch };
        setDraft(next);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            startTransition(async () => {
                const result = await onSave(next);
                if ("error" in result) onError(t.saveFailed);
            });
        }, SAVE_DEBOUNCE_MS);
    };

    const colors = resolveOrbColors(draft);
    const usingDefault = draft.colorFrom === null && draft.colorTo === null;
    const activePreset = COLOR_PRESETS.find(
        (p) => p.from === draft.colorFrom && p.to === draft.colorTo
    );
    const isDefault =
        draft.orb === DEFAULT_VOICE_ORB.orb &&
        usingDefault &&
        draft.speed === DEFAULT_VOICE_ORB.speed &&
        draft.size === DEFAULT_VOICE_ORB.size &&
        draft.mic === DEFAULT_VOICE_ORB.mic;

    return (
        <div className="space-y-6">
            <p className="px-1 text-sm text-muted-foreground">{t.description}</p>

            {/* Live preview */}
            <section className="rounded-3xl bg-surface p-4">
                <div className="flex min-h-[240px] items-center justify-center overflow-hidden">
                    <VoiceOrb
                        state={previewState}
                        settings={draft}
                        levelRef={micOn ? levelRef : undefined}
                        label={t.label}
                    />
                </div>
                <Segmented
                    options={PREVIEW_STATES}
                    value={previewState}
                    label={(s) => t.states[s]}
                    onChange={setPreviewState}
                />
                <label className="mt-3 flex items-center justify-between gap-3 px-1">
                    <span>
                        <span className="block text-sm font-semibold text-foreground">{t.micTest}</span>
                        <span className="block text-xs text-muted-foreground">{t.micTestHint}</span>
                    </span>
                    <Switch checked={micOn} onCheckedChange={toggleMic} />
                </label>
            </section>

            {/* Style */}
            <Section title={t.style}>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
                    {ORB_IDS.map((id) => {
                        const meta = ORBS[id];
                        const selected = id === draft.orb;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => update({ orb: id })}
                                aria-pressed={selected}
                                className={cn(
                                    "flex w-[104px] shrink-0 flex-col items-center gap-2 rounded-2xl border p-3 transition-colors",
                                    selected
                                        ? "border-foreground bg-surface"
                                        : "border-transparent bg-surface hover:border-border"
                                )}
                            >
                                <span
                                    className="size-10 rounded-full"
                                    style={{
                                        background: `radial-gradient(circle at 35% 35%, ${meta.colorFrom}, ${meta.colorTo})`,
                                        boxShadow: `0 6px 18px -8px ${meta.colorTo}`,
                                    }}
                                />
                                <span className="w-full truncate text-center text-xs font-semibold text-foreground">
                                    {meta.name}
                                </span>
                                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                    {t.tech[meta.tech]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* Colors */}
            <Section title={t.colors}>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => update({ colorFrom: null, colorTo: null })}
                        aria-pressed={usingDefault}
                        className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                            usingDefault ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                        )}
                    >
                        <span
                            className="size-4 rounded-full"
                            style={{
                                background: `linear-gradient(135deg, ${ORBS[draft.orb].colorFrom}, ${ORBS[draft.orb].colorTo})`,
                            }}
                        />
                        {t.orbDefault}
                    </button>
                    {COLOR_PRESETS.map((preset) => {
                        const selected = activePreset?.name === preset.name;
                        return (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => update({ colorFrom: preset.from, colorTo: preset.to })}
                                aria-pressed={selected}
                                title={preset.name}
                                className={cn(
                                    "relative size-9 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform active:scale-95",
                                    selected ? "ring-foreground" : "ring-transparent"
                                )}
                                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                            >
                                {selected && <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />}
                            </button>
                        );
                    })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {(["colorFrom", "colorTo"] as const).map((key) => (
                        <label
                            key={key}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3"
                        >
                            <span className="text-sm text-muted-foreground">
                                {key === "colorFrom" ? t.from : t.to}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{colors[key]}</span>
                                <input
                                    type="color"
                                    value={colors[key]}
                                    onChange={(e) =>
                                        update({
                                            colorFrom: key === "colorFrom" ? e.target.value : colors.colorFrom,
                                            colorTo: key === "colorTo" ? e.target.value : colors.colorTo,
                                        })
                                    }
                                    aria-label={`${t.custom} · ${key === "colorFrom" ? t.from : t.to}`}
                                    className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                                />
                            </span>
                        </label>
                    ))}
                </div>
            </Section>

            {/* Motion */}
            <Section title={t.speed}>
                <Segmented
                    options={SPEED_OPTIONS}
                    value={(SPEED_OPTIONS as readonly number[]).includes(draft.speed) ? draft.speed : 1}
                    label={(s) => t.speeds[String(s) as keyof typeof t.speeds]}
                    onChange={(speed) => update({ speed })}
                />
            </Section>

            <Section title={t.size}>
                <Segmented
                    options={SIZE_OPTIONS}
                    value={(SIZE_OPTIONS as readonly number[]).includes(draft.size) ? draft.size : 168}
                    label={(s) => t.sizes[String(s) as keyof typeof t.sizes]}
                    onChange={(size) => update({ size })}
                />
            </Section>

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
                <span>
                    <span className="block text-sm font-semibold text-foreground">{t.micReactive}</span>
                    <span className="block text-xs text-muted-foreground">{t.micReactiveHint}</span>
                </span>
                <Switch checked={draft.mic} onCheckedChange={(mic) => update({ mic })} />
            </label>

            <button
                type="button"
                disabled={isDefault}
                onClick={() => update(DEFAULT_VOICE_ORB)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold text-foreground disabled:opacity-50"
            >
                <RotateCcw className="size-4" />
                {t.reset}
            </button>
        </div>
    );
};
