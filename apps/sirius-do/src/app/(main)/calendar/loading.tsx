import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-8 w-56 rounded-lg" />
      </div>
      <Skeleton className="h-9 rounded-md" />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b">
          <div />
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex h-11 items-center justify-center border-l">
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-none bg-transparent" />
      </div>
    </div>
  );
}
