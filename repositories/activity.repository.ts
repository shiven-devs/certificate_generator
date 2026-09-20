import { ActivityDay } from "@/models/activity-day.model";

export type ActivityDayRecord = {
  date: string;
  checkIn: boolean;
  lessonCompletions: number;
  count: number;
};

export async function findActivityDaysInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ActivityDayRecord[]> {
  const rows = await ActivityDay.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  })
    .select("date checkIn lessonCompletions count")
    .lean()
    .exec();

  return rows.map((row) => ({
    date: row.date,
    checkIn: row.checkIn,
    lessonCompletions: row.lessonCompletions,
    count: row.count,
  }));
}

export async function recordCheckInDay(userId: string, date: string): Promise<void> {
  const updated = await ActivityDay.updateOne(
    { user: userId, date, checkIn: false },
    {
      $set: { checkIn: true },
      $inc: { count: 1 },
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
      lessonCompletions: 0,
      count: 1,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await ActivityDay.updateOne(
      { user: userId, date, checkIn: false },
      {
        $set: { checkIn: true },
        $inc: { count: 1 },
      },
    ).exec();
  }
}

export async function incrementLessonCompletions(
  userId: string,
  date: string,
): Promise<void> {
  try {
    await ActivityDay.updateOne(
      { user: userId, date },
      {
        $inc: { lessonCompletions: 1, count: 1 },
        $setOnInsert: { checkIn: false },
      },
      { upsert: true },
    ).exec();
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await ActivityDay.updateOne(
      { user: userId, date },
      { $inc: { lessonCompletions: 1, count: 1 } },
    ).exec();
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
