import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-4 w-6" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="aspect-square w-full rounded-[28px]" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
