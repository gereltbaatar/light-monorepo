import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>
      <div className="flex gap-2 overflow-hidden sm:grid sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] w-32 shrink-0 rounded-[22px] bg-card sm:w-auto" />
        ))}
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      {[3, 2].map((rows, s) => (
        <div key={s} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-px overflow-hidden rounded-[22px]">
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className="h-[62px] rounded-none bg-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
