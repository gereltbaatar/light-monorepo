import { Suspense } from "react";
import { getClock, getProfile } from "@workspace/sirius-core/lib/auth";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { BottomNav } from "@/app/_components/BottomNav";
import { getT } from "@/lib/i18n/server";
import { getCategories } from "@/lib/tasks";
import { MobileNav, Sidebar, type SidebarUser } from "./_components/Sidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [profile, { data }, t, { today }, categories] = await Promise.all([
    getProfile(),
    supabase.auth.getUser(),
    getT(),
    getClock(),
    getCategories(),
  ]);
  const meta = data.user?.user_metadata ?? {};
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
          <BottomNav today={today} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
