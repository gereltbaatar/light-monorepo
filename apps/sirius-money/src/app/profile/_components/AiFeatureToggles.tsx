"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AudioLines, ScanLine, Sparkles, type LucideIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import { Switch } from "@workspace/ui/components/switch";
import { setAiFeature } from "@/app/_actions/ai-features";
import { AI_FEATURES, type AiFeature } from "@/lib/ai-features";
import { useAiFeatures } from "@/lib/ai-features-client";
import { useT } from "@/lib/i18n/client";
import { aiFeaturesDict } from "@/lib/i18n/dictionaries/ai-features";

const ICONS: Record<AiFeature, LucideIcon> = {
    advisor: Sparkles,
    voice: AudioLines,
    receipt: ScanLine,
};

const ON_COLOR = "#22c55e";
const OFF_COLOR = "#ef4444";
const FADE_FROM_SIDE =
    "radial-gradient(130% 120% at 100% 50%, #000 0%, rgb(0 0 0 / 0.55) 30%, transparent 68%)";

export const AiFeatureToggles = () => {
    const saved = useAiFeatures();

    return (
        <div className="w-full overflow-hidden rounded-3xl bg-surface">
            {AI_FEATURES.map((feature, index) => (
                <Fragment key={feature}>
                    <FeatureRow feature={feature} initial={saved[feature]} />
                    {index < AI_FEATURES.length - 1 && <div className="mx-4 h-px bg-border" />}
                </Fragment>
            ))}
        </div>
    );
};

const FeatureRow = ({ feature, initial }: { feature: AiFeature; initial: boolean }) => {
    const router = useRouter();
    const t = useT(aiFeaturesDict);
    const [enabled, setEnabled] = useState(initial);
    const [isPending, startTransition] = useTransition();
    const Icon = ICONS[feature];
    const title = t.features[feature].title;

    const toggle = (next: boolean) => {
        setEnabled(next);
        startTransition(async () => {
            const result = await setAiFeature(feature, next);
            if ("error" in result) {
                setEnabled(!next);
                toast.error(t.failed);
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="relative flex h-[60px] items-center justify-between overflow-hidden px-4">
            <DotField color={enabled ? ON_COLOR : OFF_COLOR} />

            <div className="relative flex min-w-0 items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="truncate text-base font-medium text-foreground">{title}</p>
            </div>

            <Switch
                checked={enabled}
                onCheckedChange={toggle}
                disabled={isPending}
                aria-label={title}
                className="relative data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500/70"
            />
        </div>
    );
};

// Two offset dot grids drifting away from the switch side read as a spray.
const DotField = ({ color }: { color: string }) => {
    const reduceMotion = useReducedMotion();
    const layer = (size: number, dot: number, opacity: number, duration: number) => (
        <div
            className="dot-drift absolute inset-0"
            style={
                {
                    opacity,
                    backgroundImage: `radial-gradient(circle, ${color} ${dot}px, transparent ${dot + 0.6}px)`,
                    backgroundSize: `${size}px ${size}px`,
                    maskImage: FADE_FROM_SIDE,
                    WebkitMaskImage: FADE_FROM_SIDE,
                    "--dot-shift": `-${size * 2}px`,
                    "--dot-duration": `${duration}s`,
                } as React.CSSProperties
            }
        />
    );

    return (
        <motion.div
            key={color}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-3/4"
            style={{ transformOrigin: "100% 50%" }}
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
        >
            {layer(12, 1.2, 0.55, 3.2)}
            {layer(19, 0.9, 0.35, 5)}
        </motion.div>
    );
};
