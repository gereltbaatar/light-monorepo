import Link from "next/link";
import { Plus } from "lucide-react";
import type { Day } from "@workspace/sirius-core/lib/date";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function AddTaskLink({ day, category, className }: { day?: Day; category?: string; className?: string }) {
  const t = await getT();
  const params = new URLSearchParams();
  if (day) params.set("day", day);
  if (category) params.set("cat", category);

  return (
    <Link
      href={`/add-task${params.size ? `?${params}` : ""}`}
      className={cn(
        "flex h-12 flex-1 items-center gap-3 rounded-2xl bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-full bg-foreground text-background">
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
      {t.nav.create}
    </Link>
  );
}
