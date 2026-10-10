export const ORB_IDS = [
    "siri-sheet",
    "glass-orb",
    "pulse-orb",
    "halo-orb",
    "aurora-orb",
    "equalizer-orb",
    "minimal-orb",
    "particles-orb",
    "galaxy-orb",
    "gooey-orb",
    "waveform-ring",
    "siri-wave-line",
    "iridescent-flow",
    "aura-field",
    "duotone-flow",
] as const;

export type OrbId = (typeof ORB_IDS)[number];
export type OrbTech = "css" | "canvas" | "webgl" | "svg";

export interface OrbMeta {
    name: string;
    tech: OrbTech;
    colorFrom: string;
    colorTo: string;
}

export const ORBS: Record<OrbId, OrbMeta> = {
    "siri-sheet": { name: "Siri Sheet", tech: "webgl", colorFrom: "#82f4ff", colorTo: "#8e6cff" },
    "glass-orb": { name: "Glass", tech: "css", colorFrom: "#a78bfa", colorTo: "#38bdf8" },
    "pulse-orb": { name: "Pulse", tech: "css", colorFrom: "#818cf8", colorTo: "#22d3ee" },
    "halo-orb": { name: "Halo", tech: "css", colorFrom: "#818cf8", colorTo: "#f472b6" },
    "aurora-orb": { name: "Aurora", tech: "css", colorFrom: "#22d3ee", colorTo: "#a855f7" },
    "equalizer-orb": { name: "Equalizer", tech: "css", colorFrom: "#38bdf8", colorTo: "#818cf8" },
    "minimal-orb": { name: "Minimal", tech: "css", colorFrom: "#818cf8", colorTo: "#a5b4fc" },
    "particles-orb": { name: "Particles", tech: "canvas", colorFrom: "#f0abfc", colorTo: "#818cf8" },
    "galaxy-orb": { name: "Galaxy", tech: "canvas", colorFrom: "#c084fc", colorTo: "#38bdf8" },
    "gooey-orb": { name: "Gooey", tech: "svg", colorFrom: "#f472b6", colorTo: "#8b5cf6" },
    "waveform-ring": { name: "Waveform Ring", tech: "canvas", colorFrom: "#2dd4bf", colorTo: "#38bdf8" },
    "siri-wave-line": { name: "Siri Wave", tech: "canvas", colorFrom: "#22d3ee", colorTo: "#e879f9" },
    "iridescent-flow": { name: "Iridescent", tech: "webgl", colorFrom: "#c084fc", colorTo: "#67e8f9" },
    "aura-field": { name: "Aura Field", tech: "webgl", colorFrom: "#34d399", colorTo: "#60a5fa" },
    "duotone-flow": { name: "Duotone", tech: "webgl", colorFrom: "#38bdf8", colorTo: "#f472b6" },
};

export interface ColorPreset {
    name: string;
    from: string;
    to: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
    { name: "Iris", from: "#818cf8", to: "#22d3ee" },
    { name: "Orchid", from: "#8b5cf6", to: "#d946ef" },
    { name: "Aurora", from: "#22d3ee", to: "#34d399" },
    { name: "Sunset", from: "#fbbf24", to: "#f43f5e" },
    { name: "Cosmic", from: "#fc466b", to: "#3f5efb" },
    { name: "Neon", from: "#22d3ee", to: "#d946ef" },
    { name: "Metal", from: "#94a3b8", to: "#e2e8f0" },
];

export const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
export const SIZE_OPTIONS = [128, 168, 208] as const;

export const MIN_SIZE = 96;
export const MAX_SIZE = 240;
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 3;

export interface VoiceOrbSettings {
    orb: OrbId;
    /** Null means the orb's own default gradient. */
    colorFrom: string | null;
    colorTo: string | null;
    speed: number;
    size: number;
    /** Drive the orb from the microphone while recording. */
    mic: boolean;
}

export const DEFAULT_VOICE_ORB: VoiceOrbSettings = {
    orb: "siri-sheet",
    colorFrom: null,
    colorTo: null,
    speed: 1,
    size: 168,
    mic: true,
};

const HEX = /^#[0-9a-f]{6}$/i;

export const isOrbId = (value: unknown): value is OrbId =>
    typeof value === "string" && (ORB_IDS as readonly string[]).includes(value);

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const hexOrNull = (value: unknown) =>
    typeof value === "string" && HEX.test(value) ? value.toLowerCase() : null;

// Anything malformed falls back to the default so a bad row never breaks the page.
export function parseVoiceOrbSettings(raw: unknown): VoiceOrbSettings {
    if (!raw || typeof raw !== "object") return DEFAULT_VOICE_ORB;
    const data = raw as Partial<Record<keyof VoiceOrbSettings, unknown>>;
    const speed = Number(data.speed);
    const size = Number(data.size);
    return {
        orb: isOrbId(data.orb) ? data.orb : DEFAULT_VOICE_ORB.orb,
        colorFrom: hexOrNull(data.colorFrom),
        colorTo: hexOrNull(data.colorTo),
        speed: Number.isFinite(speed) ? clamp(speed, MIN_SPEED, MAX_SPEED) : DEFAULT_VOICE_ORB.speed,
        size: Number.isFinite(size) ? Math.round(clamp(size, MIN_SIZE, MAX_SIZE)) : DEFAULT_VOICE_ORB.size,
        mic: data.mic !== false,
    };
}

/** The gradient the orb actually renders with, after applying the default fallback. */
export const resolveOrbColors = (settings: VoiceOrbSettings) => ({
    colorFrom: settings.colorFrom ?? ORBS[settings.orb].colorFrom,
    colorTo: settings.colorTo ?? ORBS[settings.orb].colorTo,
});
