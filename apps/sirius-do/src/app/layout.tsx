import type { Metadata } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { AiSettingsProvider } from "@workspace/sirius-core/components/AiSettingsProvider";
import { getAiSettings } from "@workspace/sirius-core/lib/ai-settings";
import { getAuthUser } from "@workspace/sirius-core/lib/auth";
import { createClient } from "@workspace/sirius-core/supabase/server";
import { IslandToaster } from "@/app/_components/IslandToaster";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const spaceBold = localFont({ src: "./fonts/SpaceBold.otf", weight: "700", variable: "--font-space-bold", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sirius Do", description: (await getT()).meta.description };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, aiSettings] = await Promise.all([
    getLocale(),
    Promise.all([createClient(), getAuthUser()]).then(([supabase, user]) => getAiSettings(supabase, user?.id ?? null)),
  ]);

  return (
    <html
      lang={locale}
      className={`${nunito.variable} ${geistMono.variable} ${spaceBold.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <I18nProvider locale={locale}>
          <AiSettingsProvider settings={aiSettings}>
            {children}
            <IslandToaster />
          </AiSettingsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
