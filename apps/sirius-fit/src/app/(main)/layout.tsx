import { SiriusNav } from "@workspace/sirius-core/components/SiriusNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiriusNav
        app="fit"
        sections={[
          { href: "/", label: "Today" },
          { href: "/history", label: "History" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
