export type SiriusAppId = "life" | "do" | "fit" | "money";

export interface SiriusApp {
  id: SiriusAppId;
  name: string;
  description: string;
  url: string;
}

// Localhost defaults would leak into production links, so dev only.
function devUrl(port: number): string {
  return process.env.NODE_ENV === "development" ? `http://localhost:${port}` : "";
}

// NEXT_PUBLIC_* must be referenced literally for Next to inline them.
export const SIRIUS_APPS: readonly SiriusApp[] = [
  {
    id: "life",
    name: "Life",
    description: "Dashboard",
    url: process.env.NEXT_PUBLIC_SIRIUS_URL || devUrl(3100),
  },
  {
    id: "do",
    name: "Do",
    description: "Tasks & calendar",
    url: process.env.NEXT_PUBLIC_SIRIUS_DO_URL || devUrl(3101),
  },
  {
    id: "fit",
    name: "Fit",
    description: "Training & body",
    url: process.env.NEXT_PUBLIC_SIRIUS_FIT_URL || devUrl(3102),
  },
  {
    id: "money",
    name: "Money",
    description: "Income & spending",
    url: process.env.NEXT_PUBLIC_SIRIUS_MONEY_URL || devUrl(3000),
  },
];

export function appUrl(id: SiriusAppId, path = "/"): string {
  const app = SIRIUS_APPS.find((a) => a.id === id)!;
  return new URL(path, app.url).toString();
}

// Only follow `next` back into a Sirius app, never to a foreign origin.
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (next.startsWith("/") && !next.startsWith("//")) return next;

  try {
    const origin = new URL(next).origin;
    const known = SIRIUS_APPS.some((a) => a.url && new URL(a.url).origin === origin);
    return known ? next : fallback;
  } catch {
    return fallback;
  }
}
