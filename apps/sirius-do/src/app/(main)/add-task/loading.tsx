import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-[72px] rounded-[28px] bg-card" />
      <div className="flex flex-wrap gap-2">
        {[88, 64, 132, 108, 88, 104].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
