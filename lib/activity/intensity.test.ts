import { describe, expect, it } from "vitest";
import {
  formatWatchedDuration,
  formatWatchedHours,
  intensityLevelFromWatchedSeconds,
} from "@/lib/activity/intensity";

describe("heatmap intensity", () => {
  it("maps credited watch time onto five levels", () => {
    expect(intensityLevelFromWatchedSeconds(0)).toBe(0);
    expect(intensityLevelFromWatchedSeconds(5 * 60)).toBe(1);
    expect(intensityLevelFromWatchedSeconds(45 * 60)).toBe(2);
    expect(intensityLevelFromWatchedSeconds(90 * 60)).toBe(3);
    expect(intensityLevelFromWatchedSeconds(2 * 60 * 60)).toBe(4);
  });

  it("formats watch time as hours for heatmap hovers", () => {
    expect(formatWatchedHours(0)).toBe("0 hours");
    expect(formatWatchedHours(12 * 60)).toBe("0.2 hours");
    expect(formatWatchedHours(90 * 60)).toBe("1.5 hours");
    expect(formatWatchedHours(2 * 60 * 60)).toBe("2 hours");
    expect(formatWatchedHours(90)).toBe("2 min");
  });

  it("formats watch time for tooltips and summaries", () => {
    expect(formatWatchedDuration(0)).toBe("no watch time");
    expect(formatWatchedDuration(40)).toBe("40 sec watched");
    expect(formatWatchedDuration(12 * 60)).toBe("12 min watched");
    expect(formatWatchedDuration(90 * 60)).toBe("1.5 hours watched");
  });
});
