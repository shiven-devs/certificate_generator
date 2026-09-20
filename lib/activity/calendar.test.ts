import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKeyInTimeZone,
  monthGridWeeks,
  isDateKey,
  isValidTimeZone,
  resolveActivityTimeZone,
} from "@/lib/activity/calendar";

describe("activity calendar", () => {
  it("accepts valid civil date keys and rejects impossible dates", () => {
    expect(isDateKey("2026-09-20")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-09-20", -1)).toBe("2026-09-19");
  });

  it("builds a month grid that starts on Sunday and does not spill into the next month", () => {
    const weeks = monthGridWeeks("2026-09");
    expect(weeks[0]?.[2]).toBe("2026-09-01");
    expect(weeks[0]?.[0]).toBeNull();
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.flat().includes("2026-10-01")).toBe(false);
  });

  it("formats a date key in a named timezone", () => {
    const lateUtc = new Date("2026-09-20T22:00:00.000Z");
    expect(dateKeyInTimeZone(lateUtc, "UTC")).toBe("2026-09-20");
    expect(dateKeyInTimeZone(lateUtc, "Asia/Kolkata")).toBe("2026-09-21");
  });

  it("keeps the stored timezone so clients cannot hop calendars", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
    expect(resolveActivityTimeZone("UTC", "Asia/Kolkata")).toBe("UTC");
    expect(resolveActivityTimeZone(null, "Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(resolveActivityTimeZone(null, "Not/A_Zone")).toBe("UTC");
  });
});
