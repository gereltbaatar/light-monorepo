"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Section {
  href: string;
  label: string;
}

export function SectionNav({ sections }: { sections: Section[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 text-sm">
      {sections.map((s) => {
        const active = s.href === "/" ? pathname === "/" : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className="rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
