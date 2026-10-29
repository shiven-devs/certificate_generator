import { weekdaySundayIndex } from "@/lib/activity/calendar";
import type { IntensityLevel } from "@/lib/activity/intensity";

export type OgHeatmapDay = {
  date: string;
  level: IntensityLevel;
  isFuture: boolean;
};

export const OG_HEATMAP_WEEKS = 52;

/**
 * Flattens the month grids into Sunday-aligned columns for the share card.
 * Returns the most recent `weekCount` weeks, oldest first.
 */
export function heatmapStripWeeks(
  months: { weeks: (OgHeatmapDay | null)[][] }[],
  weekCount = OG_HEATMAP_WEEKS,
): IntensityLevel[][] {
  const days = months
    .flatMap((month) => month.weeks.flat())
    .filter((day): day is OgHeatmapDay => day !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (days.length === 0) {
    return [];
  }

  // Drop leading days until a column starts on a Sunday, so weekday rows line up.
  let start = 0;
  while (start < days.length && weekdaySundayIndex(days[start]!.date) !== 0) {
    start += 1;
  }

  const aligned = days.slice(start);
  const weeks: IntensityLevel[][] = [];
  for (let index = 0; index + 7 <= aligned.length; index += 7) {
    weeks.push(
      aligned
        .slice(index, index + 7)
        .map((day) => (day.isFuture ? 0 : day.level) as IntensityLevel),
    );
  }

  return weeks.slice(-weekCount);
}
