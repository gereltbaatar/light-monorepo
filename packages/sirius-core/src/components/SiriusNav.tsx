import { SIRIUS_APPS, appUrl, type SiriusAppId } from "../lib/apps";
import { SectionNav, type Section } from "./SectionNav";

interface SiriusNavProps {
  app: SiriusAppId;
  sections?: Section[];
}

// Fit has no sign-out route of its own yet.
const LOCAL_SIGNOUT: SiriusAppId[] = ["life", "do", "fit"];

export function SiriusNav({ app, sections }: SiriusNavProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4">
        <a href={appUrl("life")} className="text-sm font-semibold tracking-tight">
          Sirius
        </a>
        <nav className="flex h-full items-center gap-4 text-sm">
          {SIRIUS_APPS.map((a) => (
            <a
              key={a.id}
              href={a.url}
              aria-current={a.id === app ? "page" : undefined}
              className="flex h-full items-center border-b-2 border-transparent text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground"
            >
              {a.name}
            </a>
          ))}
        </nav>
        <form action={LOCAL_SIGNOUT.includes(app) ? "/auth/signout" : appUrl("life", "/auth/signout")} method="post" className="ml-auto">
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
      {sections && sections.length > 0 && <SectionNav sections={sections} />}
    </header>
  );
}
