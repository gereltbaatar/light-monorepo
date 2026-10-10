"use client";

import dynamic from "next/dynamic";
import type { ComponentType, RefObject } from "react";
import type { OrbProps, OrbState } from "../voice-orbs/lib/orb-state";
import { resolveOrbColors, type OrbId, type VoiceOrbSettings } from "../lib/voice-orb";
import { useVoiceOrbSettings } from "./AiSettingsProvider";

export type { OrbState };

// Canvas and WebGL orbs touch window at import time, so every orb loads client-only.
const load = (importer: () => Promise<ComponentType<OrbProps>>) =>
    dynamic(importer, { ssr: false, loading: () => null });

const ORB_COMPONENTS: Record<OrbId, ComponentType<OrbProps>> = {
    "siri-sheet": load(() => import("../voice-orbs/orbe/siri-sheet/siri-sheet").then((m) => m.SiriSheet)),
    "glass-orb": load(() => import("../voice-orbs/orbe/glass-orb/glass-orb").then((m) => m.GlassOrb)),
    "pulse-orb": load(() => import("../voice-orbs/orbe/pulse-orb/pulse-orb").then((m) => m.PulseOrb)),
    "halo-orb": load(() => import("../voice-orbs/orbe/halo-orb/halo-orb").then((m) => m.HaloOrb)),
    "aurora-orb": load(() => import("../voice-orbs/orbe/aurora-orb/aurora-orb").then((m) => m.AuroraOrb)),
    "equalizer-orb": load(() => import("../voice-orbs/orbe/equalizer-orb/equalizer-orb").then((m) => m.EqualizerOrb)),
    "minimal-orb": load(() => import("../voice-orbs/orbe/minimal-orb/minimal-orb").then((m) => m.MinimalOrb)),
    "particles-orb": load(() => import("../voice-orbs/orbe/particles-orb/particles-orb").then((m) => m.ParticlesOrb)),
    "galaxy-orb": load(() => import("../voice-orbs/orbe/galaxy-orb/galaxy-orb").then((m) => m.GalaxyOrb)),
    "gooey-orb": load(() => import("../voice-orbs/orbe/gooey-orb/gooey-orb").then((m) => m.GooeyOrb)),
    "waveform-ring": load(() => import("../voice-orbs/orbe/waveform-ring/waveform-ring").then((m) => m.WaveformRing)),
    "siri-wave-line": load(() => import("../voice-orbs/orbe/siri-wave-line/siri-wave-line").then((m) => m.SiriWaveLine)),
    "iridescent-flow": load(() => import("../voice-orbs/orbe/iridescent-flow/iridescent-flow").then((m) => m.IridescentFlow)),
    "aura-field": load(() => import("../voice-orbs/orbe/aura-field/aura-field").then((m) => m.AuraField)),
    "duotone-flow": load(() => import("../voice-orbs/orbe/duotone-flow/duotone-flow").then((m) => m.DuotoneFlow)),
};

interface VoiceOrbProps {
    state?: OrbState;
    levelRef?: RefObject<number>;
    /** Per-use overrides on top of the saved settings (used by the settings preview). */
    settings?: Partial<VoiceOrbSettings>;
    label?: string;
    className?: string;
}

export const VoiceOrb = ({ state = "idle", levelRef, settings, label = "Voice assistant", className }: VoiceOrbProps) => {
    const saved = useVoiceOrbSettings();
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
                label={label}
            />
        </div>
    );
};
