import { formatPercent } from "../lib/format";

interface MeterProps {
  label: string;
  value: number | null;
  detail?: string;
  color?: string;
}

export function Meter({ label, value, detail, color = "var(--app)" }: MeterProps) {
  const width = `${Math.min(Math.max(value ?? 0, 0), 1) * 100}%`;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{detail ?? formatPercent(value)}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
      </div>
    </div>
  );
}
