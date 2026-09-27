export type DatedWatchTime = {
  date: string;
  watchedSeconds: number;
};

export function uniqueWatchTotals(days: DatedWatchTime[]): {
  totalWatchedSeconds: number;
  totalActiveDays: number;
} {
  const secondsByDate = new Map<string, number>();

  for (const day of days) {
    secondsByDate.set(day.date, day.watchedSeconds);
  }

  let totalWatchedSeconds = 0;
  let totalActiveDays = 0;
  for (const seconds of secondsByDate.values()) {
    totalWatchedSeconds += seconds;
    if (seconds > 0) {
      totalActiveDays += 1;
    }
  }

  return { totalWatchedSeconds, totalActiveDays };
}
