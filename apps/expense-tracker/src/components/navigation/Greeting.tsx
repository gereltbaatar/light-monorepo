"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number): string {
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
}

export const Greeting = () => {
    // Render with no greeting on the server to avoid hydration mismatch
    // (server timezone != device timezone), then fill in on the client.
    const [text, setText] = useState<string>("");

    useEffect(() => {
        const update = () => setText(greetingFor(new Date().getHours()));
        update();
        // Re-evaluate every 5 minutes so a long-open page rolls over.
        const id = window.setInterval(update, 5 * 60 * 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <p className="text-2xl font-bold text-[#A6A6A6] tracking-tight h-[30px]">
            {text}
        </p>
    );
};
