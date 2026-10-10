"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, House, ListTodo, LogOut, Search, Sparkles, Wallet, type LucideIcon } from "lucide-react";
import { appUrl, type SiriusAppId } from "@workspace/sirius-core/lib/apps";
import { cn } from "@/lib/utils";

const PAGES: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const SPACES: { id: SiriusAppId; label: string; icon: LucideIcon; color: string }[] = [
  { id: "do", label: "Do", icon: ListTodo, color: "var(--domain-do)" },
  { id: "fit", label: "Fit", icon: Dumbbell, color: "var(--domain-fit)" },
  { id: "money", label: "Money", icon: Wallet, color: "var(--domain-money)" },
];

const ITEM = "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card/60 px-3 py-3 md:flex">
      <div className="flex h-9 items-center gap-2 px-2">
        <span className="grid size-6 place-items-center rounded-md bg-foreground font-space text-xs text-background">S</span>
        <span className="text-sm font-semibold tracking-tight">Sirius</span>
      </div>

      <button type="button" className={cn(ITEM, "mt-3 w-full")}>
        <Search className="size-4" />
        <span>Search</span>
        <kbd className="ml-auto rounded border px-1.5 font-mono text-[10px] text-muted-foreground">/</kbd>
      </button>

      <nav className="mt-1 space-y-0.5">
        {PAGES.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn(ITEM, active && "bg-muted text-foreground")}>
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-6 px-2 text-xs font-medium text-muted-foreground">Spaces</p>
      <nav className="mt-1 space-y-0.5">
        {SPACES.map(({ id, label, icon: Icon, color }) => (
          <a key={id} href={appUrl(id)} className={ITEM}>
            <span className="grid size-5 place-items-center rounded" style={{ backgroundColor: color }}>
              <Icon className="size-3 text-background" />
            </span>
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="rounded-lg border border-dashed p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-3.5" />
            Plan your week
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tasks, workouts and events land on the schedule automatically.</p>
          <a href={appUrl("do")} className="mt-2.5 inline-flex h-7 items-center rounded-md bg-foreground px-2.5 text-xs font-medium text-background">
            Add a task
          </a>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className={cn(ITEM, "w-full")}>
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-12 items-center gap-1 border-b px-4 md:hidden">
      <span className="mr-2 text-sm font-semibold tracking-tight">Sirius</span>
      {PAGES.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("rounded-md px-2 py-1 text-sm text-muted-foreground", active && "bg-muted text-foreground")}>
            {label}
          </Link>
        );
      })}
    </header>
  );
}
