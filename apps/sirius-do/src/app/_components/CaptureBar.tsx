"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, Keyboard, Mic, type LucideIcon } from "lucide-react";
import type { Day } from "@workspace/sirius-core/lib/date";
import { useI18n } from "@/lib/i18n/client";
import type { Category } from "@/lib/types";
import { SnapButton } from "./SnapButton";
import { VoiceButton } from "./VoiceButton";

const BUTTON =
  "group flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.97]";

function Label({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <>
      <span className="grid size-8 place-items-center rounded-full bg-background text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      {children}
    </>
  );
}

interface CaptureBarProps {
  categories: Category[];
  day?: Day;
}

// Three ways to add a task: speak it, type it, or photograph it.
export function CaptureBar({ categories, day }: CaptureBarProps) {
  const { t } = useI18n();
  const search = useSearchParams();
  const params = new URLSearchParams();
  const selectedDay = search.get("day") ?? day;
  const selectedCategory = search.get("cat");
  if (selectedDay) params.set("day", selectedDay);
  if (selectedCategory) params.set("cat", selectedCategory);

  return (
    <div className="flex gap-2">
      <VoiceButton categories={categories} wakeWord={false} className={BUTTON}>
        <Label icon={Mic}>{t.snap.say}</Label>
      </VoiceButton>
      <Link href={`/add-task${params.size ? `?${params}` : ""}`} className={BUTTON}>
        <Label icon={Keyboard}>{t.snap.type}</Label>
      </Link>
      <SnapButton categories={categories} className={BUTTON}>
        <Label icon={Camera}>{t.snap.snap}</Label>
      </SnapButton>
    </div>
  );
}
