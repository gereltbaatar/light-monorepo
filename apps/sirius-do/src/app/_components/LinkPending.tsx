"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Must render inside a <Link>; shows only while that navigation is in flight.
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return <Loader2 aria-hidden className={cn("size-3.5 animate-spin transition-opacity", pending ? "opacity-100" : "opacity-0", className)} />;
}
