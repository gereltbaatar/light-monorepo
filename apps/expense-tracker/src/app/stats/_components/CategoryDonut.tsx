import { EXPENSE_CATEGORY_KEYS, type Category } from "@/lib/categories";

const SIZE = 220;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Round caps add STROKE to each dash, so the gap must cover them plus the visible space.
const GAP = STROKE + 8;
const MIN_SHARE = GAP + 2;

interface CategoryDonutProps {
    slices: Array<{ category: Category; amount: number }>;
    labels: Record<Category, string>;
    centerValue: string;
    centerLabel: string;
}

export const CategoryDonut = ({ slices, labels, centerValue, centerLabel }: CategoryDonutProps) => {
    const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
    // Fixed category order keeps neighbouring colours the pairs the palette was validated for.
    const ordered = EXPENSE_CATEGORY_KEYS.flatMap((key) =>
        slices.filter((slice) => slice.category === key && slice.amount > 0)
    );

    const single = ordered.length === 1;
    // Tiny slices get a minimum arc so they render as a dot instead of overlapping neighbours.
    const raw = ordered.map((slice) => (slice.amount / total) * CIRCUMFERENCE);
    const small = raw.filter((share) => share < MIN_SHARE);
    const largeTotal = raw.filter((share) => share >= MIN_SHARE).reduce((sum, share) => sum + share, 0);
    const scale = largeTotal > 0 ? (CIRCUMFERENCE - small.length * MIN_SHARE) / largeTotal : 1;
    const shares = raw.map((share) => (share < MIN_SHARE ? MIN_SHARE : share * scale));

    const arcs = ordered.map((slice, index) => {
        const before = shares.slice(0, index).reduce((sum, share) => sum + share, 0);
        return {
            ...slice,
            length: single ? CIRCUMFERENCE : Math.max(shares[index] - GAP, 0.001),
            start: single ? 0 : before + GAP / 2,
        };
    });

    return (
        <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" role="img" aria-label={centerLabel}>
                {arcs.map((arc) => (
                    <circle
                        key={arc.category}
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        stroke={`var(--cat-${arc.category})`}
                        strokeWidth={STROKE}
                        strokeLinecap={arcs.length === 1 ? "butt" : "round"}
                        strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                        strokeDashoffset={-arc.start}
                    >
                        <title>{`${labels[arc.category]}: ${Math.round((arc.amount / total) * 100)}%`}</title>
                    </circle>
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold tracking-tight text-foreground">{centerValue}</p>
                <p className="text-sm text-muted-foreground">{centerLabel}</p>
            </div>
        </div>
    );
};
