import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  dateKeyInTimeZone,
  heatmapDateKeys,
  resolveActivityTimeZone,
} from "@/lib/activity/calendar";
import { intensityLevel, type IntensityLevel } from "@/lib/activity/intensity";
import { decideCheckIn } from "@/lib/activity/streak";
import {
  findUserActivityState,
  updateUserCheckIn,
} from "@/repositories/user.repository";
import {
  findActivityDaysInRange,
  incrementLessonCompletions,
  recordCheckInDay,
} from "@/repositories/activity.repository";

export type PublicActivityDay = {
  date: string;
  count: number;
  checkIn: boolean;
  lessonCompletions: number;
  level: IntensityLevel;
  isFuture: boolean;
};

export type ActivityOverview = {
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  totalActiveDays: number;
  totalLessonCompletions: number;
  timeZone: string;
  days: PublicActivityDay[];
};

export async function getActivityOverview(
  userId: string,
  now = new Date(),
): Promise<ActivityOverview> {
  const user = await findUserActivityState(userId);
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHENTICATED, "You need to sign in to continue.", 401);
  }

  const timeZone = resolveActivityTimeZone(user.activityTimeZone, undefined);
  const todayKey = dateKeyInTimeZone(now, timeZone);
  const keys = heatmapDateKeys(todayKey);
  const startDate = keys[0]!;
  const endDate = keys[keys.length - 1]!;
  const stored = await findActivityDaysInRange(userId, startDate, endDate);
  const byDate = new Map(stored.map((row) => [row.date, row]));

  const days = keys.map((date) => {
    const row = byDate.get(date);
    const count = row?.count ?? 0;
    return {
      date,
      count,
      checkIn: row?.checkIn ?? false,
      lessonCompletions: row?.lessonCompletions ?? 0,
      level: intensityLevel(count),
      isFuture: date > todayKey,
    };
  });

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    checkedInToday: user.lastCheckInDate === todayKey,
    totalActiveDays: days.filter((day) => day.count > 0).length,
    totalLessonCompletions: days.reduce((sum, day) => sum + day.lessonCompletions, 0),
    timeZone,
    days,
  };
}

export async function checkInToday(
  userId: string,
  requestedTimeZone: string | undefined,
  now = new Date(),
): Promise<ActivityOverview> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latest = await findUserActivityState(userId);
    if (!latest) {
      throw new AppError(ErrorCodes.UNAUTHENTICATED, "You need to sign in to continue.", 401);
    }

    const timeZone = resolveActivityTimeZone(latest.activityTimeZone, requestedTimeZone);
    const todayKey = dateKeyInTimeZone(now, timeZone);
    const decision = decideCheckIn({
      todayKey,
      lastCheckInDate: latest.lastCheckInDate,
      lastCheckInAt: latest.lastCheckInAt,
      now,
      currentStreak: latest.currentStreak,
      longestStreak: latest.longestStreak,
    });

    if (decision.type === "already_checked_in") {
      await recordCheckInDay(userId, todayKey);
      return getActivityOverview(userId, now);
    }

    if (decision.type === "too_soon") {
      throw new AppError(
        ErrorCodes.CHECK_IN_TOO_SOON,
        "You already checked in recently. Try again tomorrow.",
        429,
      );
    }

    if (decision.type === "invalid_date") {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "This check-in could not be recorded for today.",
        400,
      );
    }

    const updated = await updateUserCheckIn({
      userId,
      expectedLastCheckInDate: latest.lastCheckInDate,
      lastCheckInDate: todayKey,
      lastCheckInAt: now,
      currentStreak: decision.nextStreak,
      longestStreak: decision.nextLongest,
      activityTimeZone: latest.activityTimeZone ?? timeZone,
    });

    if (!updated) {
      continue;
    }

    await recordCheckInDay(userId, todayKey);
    return getActivityOverview(userId, now);
  }

  throw new AppError(
    ErrorCodes.INTERNAL_ERROR,
    "Something went wrong. Please try again.",
    500,
  );
}

export async function recordLessonCompletionActivity(
  userId: string,
  now = new Date(),
): Promise<void> {
  const user = await findUserActivityState(userId);
  if (!user) {
    return;
  }

  const timeZone = resolveActivityTimeZone(user.activityTimeZone, undefined);
  const todayKey = dateKeyInTimeZone(now, timeZone);
  await incrementLessonCompletions(userId, todayKey);
}
