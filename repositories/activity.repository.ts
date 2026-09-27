import { Types } from "mongoose";
import { normalizeDateKey, toDateKeyFromUtc } from "@/lib/activity/calendar";
import { ActivityDay } from "@/models/activity-day.model";

export type ActivityDayRecord = {
  date: string;
  checkIn: boolean;
  watchedSeconds: number;
};

export async function findActivityDaysInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ActivityDayRecord[]> {
  const rows = await ActivityDay.collection
    .find({
      user: new Types.ObjectId(userId),
      $or: [
        { date: { $gte: startDate, $lte: endDate } },
        {
          date: {
            $gte: `${startDate}T00:00:00.000Z`,
            $lte: `${endDate}T23:59:59.999Z`,
          },
        },
      ],
    })
    .project({ date: 1, checkIn: 1, watchedSeconds: 1 })
    .toArray();

  const merged = new Map<string, ActivityDayRecord>();

  for (const row of rows) {
    const date = dateFieldToKey(row.date);
    if (!date) {
      continue;
    }

    const watchedSeconds = toWatchedSeconds(row.watchedSeconds);
    const existing = merged.get(date);
    if (!existing) {
      merged.set(date, {
        date,
        checkIn: row.checkIn === true,
        watchedSeconds,
      });
      continue;
    }

    existing.checkIn = existing.checkIn || row.checkIn === true;
    existing.watchedSeconds += watchedSeconds;
  }

  return [...merged.values()];
}

function dateFieldToKey(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return toDateKeyFromUtc(value);
  }
  if (typeof value === "string") {
    return normalizeDateKey(value);
  }
  return null;
}

function toWatchedSeconds(value: unknown): number {
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }
  return seconds;
}

export async function recordCheckInDay(userId: string, date: string): Promise<void> {
  const updated = await ActivityDay.updateOne(
    { user: userId, date, checkIn: false },
    {
      $set: { checkIn: true },
    },
  ).exec();

  if (updated.matchedCount > 0) {
    return;
  }

  try {
    await ActivityDay.create({
      user: userId,
      date,
      checkIn: true,
      watchedSeconds: 0,
      lessonCompletions: 0,
      count: 0,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await ActivityDay.updateOne(
      { user: userId, date, checkIn: false },
      { $set: { checkIn: true } },
    ).exec();
  }
}

export async function incrementWatchedSeconds(
  userId: string,
  date: string,
  seconds: number,
): Promise<void> {
  const credited = Math.floor(seconds);
  if (!Number.isFinite(credited) || credited <= 0) {
    return;
  }

  try {
    await ActivityDay.collection.updateOne(
      { user: new Types.ObjectId(userId), date },
      {
        $inc: { watchedSeconds: credited },
        $setOnInsert: { checkIn: false, lessonCompletions: 0, count: 0 },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await ActivityDay.collection.updateOne(
      { user: new Types.ObjectId(userId), date },
      { $inc: { watchedSeconds: credited } },
    );
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
