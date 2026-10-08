import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { minutesToTime, weekdayOf } from "./time";
import type { TaskPriority } from "./types";

export interface ParsedTask {
  title: string;
  dueDate: Day | null;
  dueTime: string | null;
  durationMinutes: number | null;
  priority: TaskPriority | null;
}

const WEEKDAYS: [RegExp, number][] = [
  [/^(sun(day)?|ням)$/, 0],
  [/^(mon(day)?|даваа)$/, 1],
  [/^(tue(s|sday)?|мягмар)$/, 2],
  [/^(wed(nesday)?|лхагва)$/, 3],
  [/^(thu(rs|rsday)?|пүрэв)$/, 4],
  [/^(fri(day)?|баасан)$/, 5],
  [/^(sat(urday)?|бямба)$/, 6],
];
const WEEKDAY =
  "(?:sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?|ням|даваа|мягмар|лхагва|пүрэв|баасан|бямба)";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Word boundaries that also hold for Cyrillic, which \b does not.
const B = "(?<=^|[\\s,.])";
const E = "(?=$|[\\s,.!?])";

function weekdayIndex(word: string): number {
  return WEEKDAYS.find(([re]) => re.test(word))?.[1] ?? -1;
}

function nextWeekday(today: Day, weekday: number, skipThisWeek: boolean): Day {
  let diff = (weekday - weekdayOf(today) + 7) % 7 || 7;
  if (skipThisWeek && diff < 7 - ((weekdayOf(today) + 6) % 7)) diff += 7;
  return addDays(today, diff);
}

function to24h(hour: number, minute: number, meridiem: string | undefined): number | null {
  let h = hour;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  if (h > 23 || minute > 59) return null;
  return h * 60 + minute;
}

// Pulls date, time, duration and priority out of free text.
export function parseTask(input: string, today: Day): ParsedTask {
  let text = ` ${input.trim()} `;
  const result: ParsedTask = { title: "", dueDate: null, dueTime: null, durationMinutes: null, priority: null };

  // Removes the first match the handler accepts; returning false skips a match.
  const take = (source: string, flags: string, fn: (m: RegExpMatchArray) => boolean | void) => {
    for (const m of text.matchAll(new RegExp(source, `${flags}g`))) {
      if (fn(m) === false) continue;
      text = text.slice(0, m.index) + " " + text.slice(m.index! + m[0].length);
      return;
    }
  };

  take(`${B}(!{1,3})${E}`, "", (m) => {
    result.priority = m[1]!.length > 1 ? "urgent" : "high";
  });

  const clock = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?";
  take(`${B}(?:from\\s+)?${clock}\\s*(?:-|–|to)\\s*${clock}${E}`, "i", (m) => {
    if (!m[2] && !m[3] && !m[5] && !m[6]) return false;
    const from = to24h(Number(m[1]), Number(m[2] ?? 0), (m[3] ?? m[6])?.toLowerCase());
    const to = to24h(Number(m[4]), Number(m[5] ?? 0), m[6]?.toLowerCase());
    if (from === null || to === null || to <= from) return false;
    result.dueTime = minutesToTime(from);
    result.durationMinutes = to - from;
  });

  if (result.durationMinutes === null) {
    take(
      `${B}(?:for\\s+)?(\\d+(?:\\.\\d+)?)\\s*(?:h|hr|hrs|hours?|цаг)(?:\\s*(\\d+)\\s*(?:m|min|mins|minutes?|мин(?:ут)?))?${E}`,
      "i",
      (m) => {
        result.durationMinutes = Math.round(Number(m[1]) * 60) + Number(m[2] ?? 0);
      }
    );
  }
  if (result.durationMinutes === null) {
    take(`${B}(?:for\\s+)?(\\d+)\\s*(?:m|min|mins|minutes?|мин(?:ут)?)${E}`, "i", (m) => {
      result.durationMinutes = Number(m[1]);
    });
  }

  if (result.dueTime === null) {
    take(`${B}(at\\s+|@\\s*)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?(\\s*цагт)?${E}`, "i", (m) => {
      if (!m[1] && !m[3] && !m[4] && !m[5]) return false;
      const minutes = to24h(Number(m[2]), Number(m[3] ?? 0), m[4]?.toLowerCase());
      if (minutes === null) return false;
      result.dueTime = minutesToTime(minutes);
    });
  }

  take(`${B}(today|tonight|өнөөдөр|tomorrow|tmr|маргааш|day after tomorrow|нөгөөдөр)${E}`, "i", (m) => {
    const word = m[1]!.toLowerCase();
    if (word === "day after tomorrow" || word === "нөгөөдөр") result.dueDate = addDays(today, 2);
    else if (/tomorrow|tmr|маргааш/.test(word)) result.dueDate = addDays(today, 1);
    else result.dueDate = today;
    if (word === "tonight" && !result.dueTime) result.dueTime = "20:00";
  });

  if (!result.dueDate) {
    take(`${B}in\\s+(\\d+)\\s+(days?|weeks?)${E}`, "i", (m) => {
      result.dueDate = addDays(today, Number(m[1]) * (/week/i.test(m[2]!) ? 7 : 1));
    });
  }
  if (!result.dueDate) {
    take(`${B}next week${E}`, "i", () => {
      result.dueDate = nextWeekday(today, 1, false);
    });
  }
  if (!result.dueDate) {
    take(`${B}(?:on\\s+)?(next\\s+|this\\s+)?(${WEEKDAY})${E}`, "i", (m) => {
      result.dueDate = nextWeekday(today, weekdayIndex(m[2]!.toLowerCase()), Boolean(m[1]?.startsWith("next")));
    });
  }
  if (!result.dueDate) {
    take(`${B}(?:on\\s+)?(\\d{4})-(\\d{2})-(\\d{2})${E}`, "", (m) => {
      result.dueDate = `${m[1]}-${m[2]}-${m[3]}`;
    });
  }
  if (!result.dueDate) {
    take(`${B}(?:on\\s+)?(${MONTHS.join("|")})[a-z]*\\.?\\s+(\\d{1,2})${E}`, "i", (m) => {
      const month = String(MONTHS.indexOf(m[1]!.toLowerCase().slice(0, 3)) + 1).padStart(2, "0");
      const year = Number(today.slice(0, 4));
      const day = (y: number) => `${y}-${month}-${m[2]!.padStart(2, "0")}`;
      result.dueDate = day(year) < today ? day(year + 1) : day(year);
    });
  }

  result.title = text
    .replace(/\s+/g, " ")
    .replace(/\s+(at|on|for|by|from|in)\s*$/i, "")
    .trim();

  return result;
}
