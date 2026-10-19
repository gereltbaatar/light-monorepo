import { Suspense } from "react";
import { getAuthUser, getProfile } from "@workspace/sirius-core/lib/auth";
import { BottomNav } from "@/app/_components/BottomNav";
import { getT } from "@/lib/i18n/server";
import { getCategories } from "@/lib/tasks";
import { MobileNav, Sidebar, type SidebarUser } from "./_components/Sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [profile, authUser, t, categories] = await Promise.all([getProfile(), getAuthUser(), getT(), getCategories()]);
  const meta = (authUser?.metadata ?? {}) as Record<string, string | undefined>;
  const email = profile?.email ?? "";
  const user: SidebarUser = {
    name: profile?.display_name || meta.full_name || meta.name || email.split("@")[0] || t.nav.fallbackUser,
    email,
    avatarUrl: profile?.avatar_url || meta.avatar_url || meta.picture || null,
  };

  return (
    <div className="flex flex-1 bg-background text-foreground">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={user} />
        <main className="w-full flex-1 px-4 pb-44 md:px-8 md:pt-6 md:pb-6">{children}</main>
        <Suspense>
          <BottomNav categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
