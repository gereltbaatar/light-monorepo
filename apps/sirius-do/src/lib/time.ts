import type { Day } from "@workspace/sirius-core/lib/date";

export function weekdayOf(day: Day): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

export function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTime(time: string | null): string {
  return time ? time.slice(0, 5) : "";
}

export interface DurationUnits {
  min: string;
  hour: string;
}

export function formatDuration(minutes: number, units: DurationUnits): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} ${units.min}`;
  return m ? `${h} ${units.hour} ${m} ${units.min}` : `${h} ${units.hour}`;
}

export function timeRange(time: string | null, duration: number | null, units: DurationUnits): string {
  if (!time) return duration ? formatDuration(duration, units) : "";
  if (!duration) return formatTime(time);
  return `${formatTime(time)}–${minutesToTime(timeToMinutes(time) + duration)}`;
}
