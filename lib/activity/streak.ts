import { addDays } from "@/lib/activity/calendar";

export const MIN_CHECK_IN_GAP_MS = 20 * 60 * 60 * 1000;

export type CheckInDecision =
  | { type: "already_checked_in" }
  | { type: "too_soon" }
  | { type: "invalid_date" }
  | {
      type: "accepted";
      nextStreak: number;
      nextLongest: number;
    };

export function decideCheckIn(input: {
  todayKey: string;
  lastCheckInDate: string | null;
  lastCheckInAt: Date | null;
  now: Date;
  currentStreak: number;
  longestStreak: number;
  minGapMs?: number;
}): CheckInDecision {
  const minGapMs = input.minGapMs ?? MIN_CHECK_IN_GAP_MS;
  const lastDate = input.lastCheckInDate;

  if (lastDate === input.todayKey) {
    return { type: "already_checked_in" };
  }

  if (lastDate && input.todayKey < lastDate) {
    return { type: "invalid_date" };
  }

  const yesterdayKey = addDays(input.todayKey, -1);
  const isConsecutive = lastDate === yesterdayKey;
  const elapsed = input.lastCheckInAt
    ? input.now.getTime() - input.lastCheckInAt.getTime()
    : Number.POSITIVE_INFINITY;

  // Consecutive local calendar days can be minutes apart around midnight.
  // A short gap on a non-consecutive date is treated as timezone hopping.
  if (!isConsecutive && elapsed < minGapMs) {
    return { type: "too_soon" };
  }

  const nextStreak = isConsecutive ? input.currentStreak + 1 : 1;
  return {
    type: "accepted",
    nextStreak,
    nextLongest: Math.max(input.longestStreak, nextStreak),
  };
}
