"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Camera, CalendarDays, Keyboard, ListTodo, Mic, Sun, X, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LinkPending } from "./LinkPending";
import { SnapButton } from "./SnapButton";
import { VoiceButton } from "./VoiceButton";

const PAGES: { href: string; label: "today" | "tasks" | "calendar"; icon: LucideIcon }[] = [
  { href: "/", label: "today", icon: Sun },
  { href: "/tasks", label: "tasks", icon: ListTodo },
  { href: "/calendar", label: "calendar", icon: CalendarDays },
];

// Frosted glass: translucent tint, heavy blur, hairline rim and a faint top highlight.
const SURFACE =
  "bg-[#1C1C1E]/55 text-white ring-1 ring-white/10 ring-inset backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_10px_30px_-8px_rgb(0_0_0/0.5)]";
const ICON_BOX = "grid size-7 shrink-0 place-items-center";
// Item padding plus the menu's padding equals the button's, so every icon sits on one vertical line.
const MENU_ITEM =
  "group flex h-[52px] w-full items-center gap-2.5 whitespace-nowrap rounded-[14px] bg-white/[0.07] px-2.5 text-left text-[15px] font-semibold text-gray-300 ring-1 ring-white/[0.04] ring-inset transition-colors hover:bg-white/10 hover:text-white active:bg-white/15";
const BUBBLE =
  "grid size-8 shrink-0 place-items-center rounded-full bg-black/45 text-white transition-colors group-hover:bg-white group-hover:text-[#1C1C1E]";
const SPRING = "ease-[cubic-bezier(0.34,1.45,0.64,1)]";

interface BottomNavProps {
  categories: Category[];
}

export function BottomNav({ categories }: BottomNavProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  if (pathname === "/add-task") return null;

  const addParams = new URLSearchParams();
  const day = params.get("day");
  if (day) addParams.set("day", day);
  const cat = params.get("cat");
  if (cat) addParams.set("cat", cat);

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:hidden"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        <div className="mx-auto flex w-full max-w-[430px] items-end justify-between gap-3">
          <nav className={cn("flex h-16 shrink-0 items-center gap-1.5 rounded-[18px] p-2", SURFACE)}>
            {PAGES.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-label={t.nav[label]}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative grid size-12 place-items-center rounded-[10px] transition-colors duration-300",
                    active ? "bg-white text-[#1C1C1E]" : "text-gray-400",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  <LinkPending className="absolute -top-0.5 -right-0.5 size-4" />
                </Link>
              );
            })}
          </nav>

          <div className="relative w-[150px] shrink-0">
            {/* Kept mounted while closed so the voice and photo sheets survive the menu closing. */}
            <div
              id="create-menu"
              onClickCapture={() => setOpen(false)}
              className={cn(
                "absolute inset-x-0 bottom-full mb-2.5 origin-bottom space-y-1.5 rounded-[20px] p-1.5 transition-all",
                SURFACE,
                open
                  ? `translate-y-0 scale-100 opacity-100 duration-300 ${SPRING}`
                  : "pointer-events-none translate-y-3 scale-90 opacity-0 duration-150 ease-in",
              )}
            >
              {[
                <VoiceButton key="voice" categories={categories} className={MENU_ITEM}>
                  <span className={BUBBLE}>
                    <Mic className="size-4" strokeWidth={2.2} />
                  </span>
                  {t.snap.say}
                </VoiceButton>,
                <Link key="type" href={`/add-task${addParams.size ? `?${addParams}` : ""}`} className={MENU_ITEM}>
                  <span className={BUBBLE}>
                    <Keyboard className="size-4" strokeWidth={2.2} />
                  </span>
                  {t.snap.type}
                </Link>,
                <SnapButton key="image" categories={categories} className={MENU_ITEM}>
                  <span className={BUBBLE}>
                    <Camera className="size-4" strokeWidth={2.2} />
                  </span>
                  {t.snap.snap}
                </SnapButton>,
              ].map((item, i, items) => (
                <div
                  key={item.key}
                  className={cn("transition-all", open ? "translate-y-0 opacity-100 duration-300" : "translate-y-2 opacity-0 duration-100")}
                  style={{ transitionDelay: open ? `${(items.length - i) * 45}ms` : "0ms" }}
                >
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="create-menu"
              className={cn(
                "flex h-16 w-full items-center gap-3 rounded-[18px] px-[18px] text-[15px] font-semibold transition-[transform,background-color] duration-200 active:scale-95",
                SURFACE,
                open && "bg-white/15",
              )}
            >
              <span className={cn(ICON_BOX, "relative")}>
                <Image
                  src="/gemini.svg"
                  alt=""
                  width={26}
                  height={26}
                  unoptimized
                  className={cn("absolute transition-all duration-300", SPRING, open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")}
                />
                <X
                  className={cn(
                    "absolute size-[26px] transition-all duration-300",
                    SPRING,
                    open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
                  )}
                  strokeWidth={2.5}
                />
              </span>
              <span className="grid">
                <span className={cn("col-start-1 row-start-1 transition-all duration-200", open ? "-translate-y-1 opacity-0" : "opacity-100")}>
                  {t.fab.create}
                </span>
                <span className={cn("col-start-1 row-start-1 transition-all duration-200", open ? "opacity-100" : "translate-y-1 opacity-0")}>
                  {t.fab.close}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
