import Link from "next/link";
import { SectionNav } from "@workspace/sirius-core/components/SectionNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-12 max-w-6xl items-center px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Sirius Do
          </Link>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Гарах
            </button>
          </form>
        </div>
        <SectionNav
          sections={[
            { href: "/", label: "Өнөөдөр" },
            { href: "/calendar", label: "Хуанли" },
          ]}
        />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
