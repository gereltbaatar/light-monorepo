"use client";

import dynamic from "next/dynamic";
import type { ComponentType, RefObject } from "react";
import type { OrbProps, OrbState } from "./lib/orb-state";
import { useVoiceOrbSettings } from "@/lib/voice-orb-client";
import { resolveOrbColors, type OrbId, type VoiceOrbSettings } from "@/lib/voice-orb";
import { useT } from "@/lib/i18n/client";
import { orbDict } from "@/lib/i18n/dictionaries/orb";

export type { OrbState };

// Canvas and WebGL orbs touch window at import time, so every orb loads client-only.
const load = (importer: () => Promise<ComponentType<OrbProps>>) =>
    dynamic(importer, { ssr: false, loading: () => null });

const ORB_COMPONENTS: Record<OrbId, ComponentType<OrbProps>> = {
    "siri-sheet": load(() => import("./orbe/siri-sheet/siri-sheet").then((m) => m.SiriSheet)),
    "glass-orb": load(() => import("./orbe/glass-orb/glass-orb").then((m) => m.GlassOrb)),
    "pulse-orb": load(() => import("./orbe/pulse-orb/pulse-orb").then((m) => m.PulseOrb)),
    "halo-orb": load(() => import("./orbe/halo-orb/halo-orb").then((m) => m.HaloOrb)),
    "aurora-orb": load(() => import("./orbe/aurora-orb/aurora-orb").then((m) => m.AuroraOrb)),
    "equalizer-orb": load(() => import("./orbe/equalizer-orb/equalizer-orb").then((m) => m.EqualizerOrb)),
    "minimal-orb": load(() => import("./orbe/minimal-orb/minimal-orb").then((m) => m.MinimalOrb)),
    "particles-orb": load(() => import("./orbe/particles-orb/particles-orb").then((m) => m.ParticlesOrb)),
    "galaxy-orb": load(() => import("./orbe/galaxy-orb/galaxy-orb").then((m) => m.GalaxyOrb)),
    "gooey-orb": load(() => import("./orbe/gooey-orb/gooey-orb").then((m) => m.GooeyOrb)),
    "waveform-ring": load(() => import("./orbe/waveform-ring/waveform-ring").then((m) => m.WaveformRing)),
    "siri-wave-line": load(() => import("./orbe/siri-wave-line/siri-wave-line").then((m) => m.SiriWaveLine)),
    "iridescent-flow": load(() => import("./orbe/iridescent-flow/iridescent-flow").then((m) => m.IridescentFlow)),
    "aura-field": load(() => import("./orbe/aura-field/aura-field").then((m) => m.AuraField)),
    "duotone-flow": load(() => import("./orbe/duotone-flow/duotone-flow").then((m) => m.DuotoneFlow)),
};

interface VoiceOrbProps {
    state?: OrbState;
    levelRef?: RefObject<number>;
    /** Per-use overrides on top of the saved settings (used by the settings preview). */
    settings?: Partial<VoiceOrbSettings>;
    className?: string;
}

export const VoiceOrb = ({ state = "idle", levelRef, settings, className }: VoiceOrbProps) => {
    const saved = useVoiceOrbSettings();
    const t = useT(orbDict);
    const merged = { ...saved, ...settings };
    const Orb = ORB_COMPONENTS[merged.orb];
    const { colorFrom, colorTo } = resolveOrbColors(merged);

    return (
        // Reserves the box before the chunk arrives so the layout never jumps.
        <div
            className={className}
            style={{ width: merged.size, height: merged.size, display: "grid", placeItems: "center" }}
        >
            <Orb
                state={state}
                size={merged.size}
                speed={merged.speed}
                colorFrom={colorFrom}
                colorTo={colorTo}
                levelRef={levelRef}
                label={t.label}
            />
        </div>
    );
};
