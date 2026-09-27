import { describe, expect, it } from "vitest";
import { uniqueWatchTotals } from "@/lib/activity/watch-totals";

describe("heatmap year totals", () => {
  it("does not double-count the same civil date", () => {
    const totals = uniqueWatchTotals([
      { date: "2026-09-24", watchedSeconds: 2.8 * 3600 },
      { date: "2026-09-25", watchedSeconds: 0.5 * 3600 },
      { date: "2026-09-26", watchedSeconds: 0.9 * 3600 },
      { date: "2026-09-27", watchedSeconds: 1.1 * 3600 },
      { date: "2026-09-27", watchedSeconds: 1.1 * 3600 },
    ]);

    expect(totals.totalActiveDays).toBe(4);
    expect(totals.totalWatchedSeconds / 3600).toBeCloseTo(5.3, 5);
  });
});
