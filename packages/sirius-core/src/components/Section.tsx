import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  action?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}

export function Section({ title, action, className, children }: SectionProps) {
  return (
    <section className={`rounded-lg border bg-card p-4 ${className ?? ""}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
        {action && (
          <a href={action.href} className="text-xs text-muted-foreground hover:text-foreground">
            {action.label} →
          </a>
        )}
      </div>
      {children}
    </section>
  );
}
