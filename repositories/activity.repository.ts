import { Types } from "mongoose";
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
      date: { $gte: startDate, $lte: endDate },
    })
    .project({ date: 1, checkIn: 1, watchedSeconds: 1 })
    .toArray();

  return rows.map((row) => ({
    date: String(row.date),
    checkIn: row.checkIn === true,
    watchedSeconds: typeof row.watchedSeconds === "number" ? row.watchedSeconds : 0,
  }));
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
