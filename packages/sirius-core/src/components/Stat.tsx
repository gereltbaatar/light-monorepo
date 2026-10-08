interface StatProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "income" | "expense";
}

const TONES = {
  default: "text-foreground",
  income: "text-income",
  expense: "text-expense",
};

export function Stat({ label, value, hint, tone = "default" }: StatProps) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-xl font-medium tabular-nums ${TONES[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
