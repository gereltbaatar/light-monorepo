"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionary";

type GreetingKey = keyof Dictionary["greeting"];

function greetingFor(hour: number): GreetingKey {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

// Filled in on the client because the server's clock isn't the device's.
export function Greeting({ className }: { className?: string }) {
  const { t } = useI18n();
  const [key, setKey] = useState<GreetingKey | null>(null);

  useEffect(() => {
    const update = () => setKey(greetingFor(new Date().getHours()));
    update();
    const id = window.setInterval(update, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return <p className={className}>{key ? t.greeting[key] : ""}</p>;
}
