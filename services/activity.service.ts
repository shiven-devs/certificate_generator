import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  heatmapMonthKeys,
  heatmapRange,
  monthGridWeeks,
  monthLabel,
  resolveActivityTimeZone,
  dateKeyInTimeZone,
} from "@/lib/activity/calendar";
import {
  formatWatchedDuration,
  intensityLevelFromWatchedSeconds,
  type IntensityLevel,
} from "@/lib/activity/intensity";
import { decideCheckIn } from "@/lib/activity/streak";
import {
  findUserActivityState,
  updateUserCheckIn,
} from "@/repositories/user.repository";
import {
  findActivityDaysInRange,
  incrementWatchedSeconds,
  recordCheckInDay,
} from "@/repositories/activity.repository";

export type PublicActivityDay = {
  date: string;
  watchedSeconds: number;
  checkIn: boolean;
  level: IntensityLevel;
  isFuture: boolean;
};

export type HeatmapMonth = {
  key: string;
  label: string;
  weeks: (PublicActivityDay | null)[][];
};

export type ActivityOverview = {
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  totalActiveDays: number;
  totalWatchedSeconds: number;
  totalWatchedLabel: string;
  timeZone: string;
  months: HeatmapMonth[];
};

function toPublicDay(
  date: string,
  todayKey: string,
  watchedSeconds: number,
  checkIn: boolean,
): PublicActivityDay {
  return {
    date,
    watchedSeconds,
    checkIn,
    level: intensityLevelFromWatchedSeconds(watchedSeconds),
    isFuture: date > todayKey,
  };
}

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
  const { startDate, endDate } = heatmapRange(todayKey);
  const stored = await findActivityDaysInRange(userId, startDate, endDate);
  const byDate = new Map(stored.map((row) => [row.date, row]));

  const months = heatmapMonthKeys(todayKey).map((yearMonth) => ({
    key: yearMonth,
    label: monthLabel(`${yearMonth}-01`),
    weeks: monthGridWeeks(yearMonth).map((week) =>
      week.map((date) => {
        if (!date) {
          return null;
        }
        const row = byDate.get(date);
        return toPublicDay(
          date,
          todayKey,
          row?.watchedSeconds ?? 0,
          row?.checkIn ?? false,
        );
      }),
    ),
  }));

  const days = months.flatMap((month) =>
    month.weeks.flatMap((week) => week.filter((day) => day !== null)),
  );
  const totalWatchedSeconds = days.reduce((sum, day) => sum + day.watchedSeconds, 0);

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    checkedInToday: user.lastCheckInDate === todayKey,
    totalActiveDays: days.filter((day) => day.watchedSeconds > 0).length,
    totalWatchedSeconds,
    totalWatchedLabel: formatWatchedDuration(totalWatchedSeconds),
    timeZone,
    months,
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

export async function recordWatchedActivity(
  userId: string,
  creditedSeconds: number,
  now = new Date(),
): Promise<void> {
  if (!Number.isFinite(creditedSeconds) || creditedSeconds <= 0) {
    return;
  }

  const user = await findUserActivityState(userId);
  if (!user) {
    return;
  }

  const timeZone = resolveActivityTimeZone(user.activityTimeZone, undefined);
  const todayKey = dateKeyInTimeZone(now, timeZone);
  await incrementWatchedSeconds(userId, todayKey, creditedSeconds);
}
