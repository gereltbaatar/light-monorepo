import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline · Expense Tracker" };

// Precached by the service worker, so it must not depend on the session or locale.
export default function OfflinePage() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-surface">
                <WifiOff className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">Интернэт холболт алга</h1>
                <p className="text-sm text-muted-foreground">
                    Холболтоо шалгаад дахин оролдоно уу.
                </p>
                <p className="pt-2 text-xs text-muted-foreground/70">
                    You are offline. Check your connection and try again.
                </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- retry needs a full reload, not client navigation */}
            <a
                href="/"
                className="mt-2 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
                Дахин оролдох · Retry
            </a>
        </main>
    );
}
