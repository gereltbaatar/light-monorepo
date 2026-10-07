"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { homeDict } from "@/lib/i18n/dictionaries/home";

type GreetingKey = keyof (typeof homeDict)["en"]["greeting"];

function greetingFor(hour: number): GreetingKey {
    if (hour < 5) return "night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
}

export const Greeting = () => {
    // Render with no greeting on the server to avoid hydration mismatch
    // (server timezone != device timezone), then fill in on the client.
    const t = useT(homeDict);
    const [key, setKey] = useState<GreetingKey | null>(null);

    useEffect(() => {
        const update = () => setKey(greetingFor(new Date().getHours()));
        update();
        // Re-evaluate every 5 minutes so a long-open page rolls over.
        const id = window.setInterval(update, 5 * 60 * 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <p className="text-2xl font-bold text-muted-foreground tracking-tight h-[30px]">
            {key ? t.greeting[key] : ""}
        </p>
    );
};
