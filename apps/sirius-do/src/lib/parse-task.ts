import { addDays, type Day } from "@workspace/sirius-core/lib/date";
import { minutesToTime, weekdayOf } from "./time";
import type { TaskPriority } from "./types";

export interface ParsedTask {
  title: string;
  dueDate: Day | null;
  dueTime: string | null;
  durationMinutes: number | null;
  priority: TaskPriority | null;
  notes: string | null;
}

// Mongolian is often typed in Latin letters, so each weekday has those spellings too.
const WEEKDAY_WORDS: string[][] = [
  ["sun", "sunday", "ням", "nyam", "niam"],
  ["mon", "monday", "даваа", "davaa"],
  ["tue", "tues", "tuesday", "мягмар", "myagmar", "mygmar", "miagmar"],
  ["wed", "wednesday", "лхагва", "lhagva", "lkhagva"],
  ["thu", "thurs", "thursday", "пүрэв", "purev", "pürev", "puruv"],
  ["fri", "friday", "баасан", "baasan"],
  ["sat", "saturday", "бямба", "byamba", "bymba", "biamba"],
];
const WEEKDAY = `(?:${WEEKDAY_WORDS.flat().sort((a, b) => b.length - a.length).join("|")})`;
const TODAY_WORDS = ["today", "өнөөдөр", "unuudur", "onoodor", "unuudr", "önöödör"];
const TOMORROW_WORDS = ["tomorrow", "tmr", "маргааш", "margaash", "margash"];
const AFTER_TOMORROW_WORDS = ["day after tomorrow", "нөгөөдөр", "nuguudur", "nogoodor", "nögöödör"];
const DAY_WORDS = [...TODAY_WORDS, "tonight", ...TOMORROW_WORDS, ...AFTER_TOMORROW_WORDS];
const HOUR_SUFFIX = "цагт|цагаас|цагийн|tsagt|tsagaas|tsagiin";
const MORNING = ["өглөө", "ogloo", "ögloo"];
const EVENING = ["орой", "oroi", "шөнө", "shono", "үдээс хойш", "udees hoish"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Word boundaries that also hold for Cyrillic, which \b does not.
const B = "(?<=^|[\\s,.])";
const E = "(?=$|[\\s,.!?])";

function weekdayIndex(word: string): number {
  return WEEKDAY_WORDS.findIndex((words) => words.includes(word));
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
  const [main = "", ...rest] = input.split("//");
  let text = ` ${main.trim()} `;
  const result: ParsedTask = {
    title: "",
    dueDate: null,
    dueTime: null,
    durationMinutes: null,
    priority: null,
    notes: rest.join("//").trim() || null,
  };

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
  if (!result.priority) {
    take(`${B}(p[1-4]|urgent|asap|яаралтай|important|чухал|low priority)${E}`, "i", (m) => {
      const word = m[1]!.toLowerCase();
      const levels: Record<string, TaskPriority> = { p1: "urgent", p2: "high", p3: "medium", p4: "low" };
      result.priority = levels[word] ?? (/urgent|asap|яаралтай/.test(word) ? "urgent" : /low/.test(word) ? "low" : "high");
    });
  }

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
      `${B}(?:for\\s+)?(\\d+(?:\\.\\d+)?)\\s*(?:h|hr|hrs|hours?|цаг|tsag)(?:\\s*(\\d+)\\s*(?:m|min|mins|minutes?|мин(?:ут)?|minut))?${E}`,
      "i",
      (m) => {
        result.durationMinutes = Math.round(Number(m[1]) * 60) + Number(m[2] ?? 0);
      }
    );
  }
  if (result.durationMinutes === null) {
    take(`${B}(?:for\\s+)?(\\d+)\\s*(?:m|min|mins|minutes?|мин(?:ут)?|minut)${E}`, "i", (m) => {
      result.durationMinutes = Number(m[1]);
    });
  }

  if (result.dueTime === null) {
    const part = [...MORNING, ...EVENING].join("|");
    take(`${B}(at\\s+|@\\s*)?(?:(${part})\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?(\\s*(?:${HOUR_SUFFIX}))?${E}`, "i", (m) => {
      const [, at, dayPart, hourText, minuteText, meridiemText, suffix] = m;
      if (!at && !dayPart && !minuteText && !meridiemText && !suffix) return false;
      const hour = Number(hourText);
      let meridiem = meridiemText?.toLowerCase();
      if (!meridiem && dayPart) meridiem = MORNING.includes(dayPart.toLowerCase()) ? "am" : "pm";
      // "3 цагт" in speech means 15:00; nobody schedules a task for 3 a.m. without saying so.
      if (!meridiem && suffix && hour >= 1 && hour <= 6) meridiem = "pm";
      const minutes = to24h(hour, Number(minuteText ?? 0), meridiem);
      if (minutes === null) return false;
      result.dueTime = minutesToTime(minutes);
    });
  }

  take(`${B}(${DAY_WORDS.join("|")})${E}`, "i", (m) => {
    const word = m[1]!.toLowerCase();
    if (AFTER_TOMORROW_WORDS.includes(word)) result.dueDate = addDays(today, 2);
    else if (TOMORROW_WORDS.includes(word)) result.dueDate = addDays(today, 1);
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
    .trim()
    .replace(/^(би|bi)\s+/i, "");

  return result;
}
