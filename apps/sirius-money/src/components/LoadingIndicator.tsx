"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Each shape is a polar wave: k lobes of relative depth a.
const SHAPES = [
    { k: 9, a: 0.08 },
    { k: 5, a: 0.12 },
    { k: 2, a: 0.16 },
    { k: 8, a: 0.07 },
    { k: 4, a: 0.12 },
    { k: 12, a: 0.05 },
];

const SAMPLES = 96;
const MORPH_MS = 650;
const SPIN_MS = 4700;

const radius = (shape: { k: number; a: number }, t: number) =>
    (1 + shape.a * Math.cos(shape.k * t)) / (1 + shape.a);

// Slight overshoot gives the morph the springy feel of the M3 indicator.
const easeOutBack = (x: number) => {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

function pathFor(from: number, to: number, progress: number, rotation: number) {
    const a = SHAPES[from];
    const b = SHAPES[to];
    let d = "";
    for (let i = 0; i < SAMPLES; i++) {
        const t = (i / SAMPLES) * Math.PI * 2;
        const r = 20 * (radius(a, t) + (radius(b, t) - radius(a, t)) * progress);
        const angle = t + rotation;
        d += `${i ? "L" : "M"}${(24 + r * Math.cos(angle)).toFixed(2)} ${(24 + r * Math.sin(angle)).toFixed(2)}`;
    }
    return `${d}Z`;
}

// Google's four brand hues, cycled one per morph.
const GOOGLE_COLORS: Array<[number, number, number]> = [
    [66, 133, 244],
    [234, 67, 53],
    [251, 188, 5],
    [52, 168, 83],
];

const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
    `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")})`;

interface LoadingIndicatorProps {
    size?: number;
    /** Draws the shape inside a filled circle, for use over busy content. */
    contained?: boolean;
    className?: string;
    label?: string;
    /** Cycles through Google's colours instead of using the text colour. */
    colorful?: boolean;
}

export const LoadingIndicator = ({
    size = 48,
    contained = false,
    className,
    label = "Loading",
    colorful = false,
}: LoadingIndicatorProps) => {
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            // rAF timestamps can predate performance.now(), so the first frame may go negative.
            const elapsed = Math.max(0, now - start);
            const step = Math.floor(elapsed / MORPH_MS);
            const local = Math.min(1, (elapsed % MORPH_MS) / (MORPH_MS * 0.7));
            const eased = reduced ? 0 : easeOutBack(local);
            const from = reduced ? 0 : step % SHAPES.length;
            const to = reduced ? 0 : (step + 1) % SHAPES.length;
            // Steady spin plus a quarter turn kicked in with each morph.
            const rotation =
                (elapsed / SPIN_MS) * Math.PI * 2 +
                (reduced ? 0 : (step + eased) * (Math.PI / 2));

            pathRef.current?.setAttribute("d", pathFor(from, to, eased, rotation));
            if (colorful) {
                const colorStep = reduced ? Math.floor(elapsed / 1500) : step;
                const fade = reduced ? 0 : Math.min(local, 1);
                pathRef.current?.setAttribute(
                    "fill",
                    mix(
                        GOOGLE_COLORS[colorStep % GOOGLE_COLORS.length],
                        GOOGLE_COLORS[(colorStep + 1) % GOOGLE_COLORS.length],
                        fade
                    )
                );
            }
            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [colorful]);

    return (
        <span
            role="progressbar"
            aria-label={label}
            className={cn(
                "inline-flex shrink-0 items-center justify-center",
                contained && "rounded-full bg-surface-2",
                className
            )}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 48 48"
                width={contained ? size * 0.6 : size}
                height={contained ? size * 0.6 : size}
                aria-hidden
            >
                <path
                    ref={pathRef}
                    d={pathFor(0, 0, 0, 0)}
                    fill={colorful ? mix(GOOGLE_COLORS[0], GOOGLE_COLORS[0], 0) : "currentColor"}
                />
            </svg>
        </span>
    );
};
