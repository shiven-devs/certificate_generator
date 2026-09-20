const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const HEATMAP_WEEK_COUNT = 53;

export function isDateKey(value: string): boolean {
  const match = DATE_KEY.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseDateKey(key: string): Date {
  if (!isDateKey(key)) {
    throw new Error("Invalid date key.");
  }

  const [, year, month, day] = DATE_KEY.exec(key)!;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

export function toDateKeyFromUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKeyFromUtc(date);
}

export function weekdaySundayIndex(key: string): number {
  return parseDateKey(key).getUTCDay();
}

export function startOfWeekSunday(key: string): string {
  return addDays(key, -weekdaySundayIndex(key));
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")}`;
}

export function resolveActivityTimeZone(
  stored: string | null | undefined,
  requested: string | undefined,
): string {
  if (stored && isValidTimeZone(stored)) {
    return stored;
  }
  if (requested && isValidTimeZone(requested)) {
    return requested;
  }
  return "UTC";
}

export function heatmapDateKeys(
  todayKey: string,
  weekCount = HEATMAP_WEEK_COUNT,
): string[] {
  const weekStart = startOfWeekSunday(todayKey);
  const gridEnd = addDays(weekStart, 6);
  const gridStart = addDays(gridEnd, -(weekCount * 7 - 1));
  const keys: string[] = [];

  for (let index = 0; index < weekCount * 7; index += 1) {
    keys.push(addDays(gridStart, index));
  }

  return keys;
}

export function monthLabel(key: string): string {
  return parseDateKey(key).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}
