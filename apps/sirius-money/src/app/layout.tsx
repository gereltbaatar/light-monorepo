import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { IslandToaster } from "@/components/IslandToaster";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { AiSettingsProvider } from "@workspace/sirius-core/components/AiSettingsProvider";
import { getAiSettings } from "@/lib/ai-features-server";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const spaceBold = localFont({
  src: "./fonts/SpaceBold.otf",
  weight: "700",
  variable: "--font-space-bold",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and manage your budget",
  manifest: "/manifest.json",
  applicationName: "Expense Tracker",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, aiSettings] = await Promise.all([getLocale(), getAiSettings()]);

  return (
    <html
      lang={locale}
      className={`${nunito.variable} ${spaceBold.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <LocaleProvider locale={locale}>
            <AiSettingsProvider settings={aiSettings}>
              <RegisterServiceWorker />
              {children}
              <IslandToaster />
            </AiSettingsProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
