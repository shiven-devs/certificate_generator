import { describe, expect, it } from "vitest";
import { decideCheckIn } from "@/lib/activity/streak";

const now = new Date("2026-09-20T10:00:00.000Z");

describe("check-in streak", () => {
  it("starts a streak on the first check-in", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-20",
        lastCheckInDate: null,
        lastCheckInAt: null,
        now,
        currentStreak: 0,
        longestStreak: 0,
      }),
    ).toEqual({ type: "accepted", nextStreak: 1, nextLongest: 1 });
  });

  it("increments after a consecutive calendar day", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-20",
        lastCheckInDate: "2026-09-19",
        lastCheckInAt: new Date("2026-09-19T23:50:00.000Z"),
        now,
        currentStreak: 4,
        longestStreak: 6,
      }),
    ).toEqual({ type: "accepted", nextStreak: 5, nextLongest: 6 });
  });

  it("resets after a missed day", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-20",
        lastCheckInDate: "2026-09-18",
        lastCheckInAt: new Date("2026-09-18T10:00:00.000Z"),
        now,
        currentStreak: 9,
        longestStreak: 9,
      }),
    ).toEqual({ type: "accepted", nextStreak: 1, nextLongest: 9 });
  });

  it("does not increment twice on the same day", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-20",
        lastCheckInDate: "2026-09-20",
        lastCheckInAt: new Date("2026-09-20T01:00:00.000Z"),
        now,
        currentStreak: 3,
        longestStreak: 3,
      }),
    ).toEqual({ type: "already_checked_in" });
  });

  it("rejects a non-consecutive check-in that arrives too soon", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-22",
        lastCheckInDate: "2026-09-20",
        lastCheckInAt: new Date("2026-09-20T09:00:00.000Z"),
        now,
        currentStreak: 1,
        longestStreak: 1,
      }),
    ).toEqual({ type: "too_soon" });
  });

  it("rejects a check-in dated before the last recorded day", () => {
    expect(
      decideCheckIn({
        todayKey: "2026-09-19",
        lastCheckInDate: "2026-09-20",
        lastCheckInAt: new Date("2026-09-20T01:00:00.000Z"),
        now,
        currentStreak: 2,
        longestStreak: 2,
      }),
    ).toEqual({ type: "invalid_date" });
  });
});
