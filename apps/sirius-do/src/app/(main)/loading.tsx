import { Skeleton } from "@workspace/ui/components/skeleton";

// Shown instantly on navigation while the server renders the next page.
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
      <Skeleton className="mx-auto h-5 w-24 rounded-lg" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-2xl bg-card" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 flex-1 rounded-2xl bg-card" />
        ))}
      </div>
    </div>
  );
}
