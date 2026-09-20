const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const HEATMAP_WEEK_COUNT = 53;
export const HEATMAP_MONTH_COUNT = 12;

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

export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function addMonths(dateKey: string, months: number): string {
  const date = parseDateKey(`${monthKey(dateKey)}-01`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toDateKeyFromUtc(date);
}

export function daysInMonth(yearMonth: string): number {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function heatmapMonthKeys(
  todayKey: string,
  monthCount = HEATMAP_MONTH_COUNT,
): string[] {
  const start = addMonths(todayKey, -(monthCount - 1));
  return Array.from({ length: monthCount }, (_, index) =>
    monthKey(addMonths(start, index)),
  );
}

export function monthGridWeeks(yearMonth: string): (string | null)[][] {
  const firstDay = `${yearMonth}-01`;
  const leading = weekdaySundayIndex(firstDay);
  const length = daysInMonth(yearMonth);
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= length; day += 1) {
    cells.push(`${yearMonth}-${String(day).padStart(2, "0")}`);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function heatmapRange(todayKey: string): { startDate: string; endDate: string } {
  const months = heatmapMonthKeys(todayKey);
  const firstMonth = months[0]!;
  const lastMonth = months[months.length - 1]!;
  return {
    startDate: `${firstMonth}-01`,
    endDate: `${lastMonth}-${String(daysInMonth(lastMonth)).padStart(2, "0")}`,
  };
}
