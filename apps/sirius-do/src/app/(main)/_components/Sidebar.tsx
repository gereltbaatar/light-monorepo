"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  House,
  ListTodo,
  LogOut,
  Search,
  Settings,
  Sun,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { appUrl, type SiriusAppId } from "@workspace/sirius-core/lib/apps";
import { SiriusLogo } from "@/app/_components/SiriusLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Greeting } from "./Greeting";
import { SettingsDialog } from "./SettingsDialog";
import { UserAvatar, type SidebarUser } from "./UserAvatar";

export type { SidebarUser };

const PAGES: { href: string; label: "today" | "tasks" | "categories" | "calendar"; icon: LucideIcon }[] = [
  { href: "/", label: "today", icon: Sun },
  { href: "/tasks", label: "tasks", icon: ListTodo },
  { href: "/categories", label: "categories", icon: Tags },
  { href: "/calendar", label: "calendar", icon: CalendarDays },
];

const SPACES: {
  id: SiriusAppId;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { id: "life", label: "Life", icon: House, color: "var(--muted-foreground)" },
  { id: "fit", label: "Fit", icon: Dumbbell, color: "var(--domain-fit)" },
  { id: "money", label: "Money", icon: Wallet, color: "var(--domain-money)" },
];

const ITEM =
  "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function ProfileMenu({
  user,
  compact,
}: {
  user: SidebarUser;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(
            compact
              ? "ml-auto rounded-full"
              : "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-muted",
          )}
          aria-label={t.nav.profile}
        >
          <UserAvatar user={user} className={compact ? "size-14 text-lg" : undefined} />
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {user.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={compact ? "bottom" : "top"}
          align={compact ? "end" : "start"}
          className="w-56 bg-popover text-popover-foreground"
        >
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onSelect={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            {t.nav.settings}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action="/auth/signout" method="post">
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full gap-2">
                <LogOut className="size-4" />
                {t.nav.signOut}
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog user={user} open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card/60 px-3 py-3 md:flex">
      <div className="flex h-12 items-center gap-2.5 px-2">
        <SiriusLogo className="size-9" />
        <span className="font-space text-xl leading-none tracking-[-0.04em]">
          SIRIUS
        </span>
        <span className="text-base font-light text-muted-foreground">/</span>
        <span className="font-space text-xl leading-none tracking-[-0.04em]">
          TASK
        </span>
      </div>

      <button type="button" className={cn(ITEM, "mt-3 w-full")}>
        <Search className="size-4" />
        <span>{t.nav.search}</span>
        <kbd className="ml-auto rounded border px-1.5 font-mono text-[10px]">
          /
        </kbd>
      </button>

      <nav className="mt-1 space-y-0.5">
        {PAGES.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              ITEM,
              isActive(pathname, href) && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t.nav[label]}
          </Link>
        ))}
      </nav>

      <p className="mt-6 px-2 text-xs font-medium text-muted-foreground">
        {t.nav.apps}
      </p>
      <nav className="mt-1 space-y-0.5">
        {SPACES.map(({ id, label, icon: Icon, color }) => (
          <a key={id} href={appUrl(id)} className={ITEM}>
            <span
              className="grid size-5 place-items-center rounded"
              style={{ backgroundColor: color }}
            >
              <Icon className="size-3 text-background" />
            </span>
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-auto">
        <ProfileMenu user={user} />
      </div>
    </aside>
  );
}

export function MobileNav({ user }: { user: SidebarUser }) {

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-6 md:hidden">
      <div className="min-w-0">
        <Greeting className="h-[30px] text-2xl font-bold tracking-tight text-muted-foreground" />
        <h1 className="h-[30px] truncate text-2xl font-bold tracking-tight">{user.name}</h1>
      </div>
      <ProfileMenu user={user} compact />
    </header>
  );
}
