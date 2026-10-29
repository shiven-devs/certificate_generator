import { describe, expect, it } from "vitest";
import type { IntensityLevel } from "@/lib/activity/intensity";
import { heatmapStripWeeks, type OgHeatmapDay } from "@/lib/profile/og-heatmap";

function day(date: string, level: IntensityLevel, isFuture = false): OgHeatmapDay {
  return { date, level, isFuture };
}

/** 2026-01-04 is a Sunday. */
function month(days: OgHeatmapDay[], leadingNulls = 0) {
  const cells: (OgHeatmapDay | null)[] = [
    ...Array.from({ length: leadingNulls }, () => null),
    ...days,
  ];
  const weeks: (OgHeatmapDay | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return { weeks };
}

function range(start: string, length: number, level: IntensityLevel = 1) {
  const days: OgHeatmapDay[] = [];
  const date = new Date(`${start}T00:00:00.000Z`);
  for (let index = 0; index < length; index += 1) {
    days.push(day(date.toISOString().slice(0, 10), level));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

describe("heatmapStripWeeks", () => {
  it("returns no weeks when there are no days", () => {
    expect(heatmapStripWeeks([])).toEqual([]);
    expect(heatmapStripWeeks([month([], 3)])).toEqual([]);
  });

  it("drops padding cells and starts each column on a Sunday", () => {
    // 2026-01-01 is a Thursday, so the first three days are dropped.
    const weeks = heatmapStripWeeks([month(range("2026-01-01", 14), 4)]);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toHaveLength(7);
  });

  it("keeps only the most recent weeks, oldest first", () => {
    const days = [
      ...range("2026-01-04", 7, 1),
      ...range("2026-01-11", 7, 2),
      ...range("2026-01-18", 7, 3),
    ];
    const weeks = heatmapStripWeeks([month(days)], 2);
    expect(weeks).toEqual([
      [2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3],
    ]);
  });

  it("renders future days as empty squares", () => {
    const days = range("2026-01-04", 7, 4).map((entry, index) =>
      index > 3 ? { ...entry, isFuture: true } : entry,
    );
    expect(heatmapStripWeeks([month(days)])).toEqual([[4, 4, 4, 4, 0, 0, 0]]);
  });

  it("joins days that span several month grids", () => {
    const weeks = heatmapStripWeeks([
      month(range("2026-01-04", 28, 1)),
      month(range("2026-02-01", 28, 2)),
    ]);
    expect(weeks).toHaveLength(8);
    expect(weeks[0]).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(weeks[7]).toEqual([2, 2, 2, 2, 2, 2, 2]);
  });
});
