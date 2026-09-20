import { Types } from "mongoose";
import { User, type UserDocument } from "@/models/user.model";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmailWithPassword(email: string) {
  return User.findOne({ email }).select("+passwordHash").exec();
}

export async function findUserByEmail(email: string) {
  return User.findOne({ email }).exec();
}

export async function findUserByGoogleId(googleId: string) {
  return User.findOne({ googleId }).exec();
}

export async function findUserById(id: string) {
  return User.findById(id).exec();
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  currentSessionId: string;
}) {
  return User.create(input);
}

export async function linkGoogleId(userId: string, googleId: string) {
  return User.findOneAndUpdate(
    {
      _id: userId,
      $or: [{ googleId: { $exists: false } }, { googleId: null }],
    },
    { $set: { googleId } },
    { new: true },
  ).exec();
}

export async function rotateSessionId(userId: string, sessionId: string) {
  await User.updateOne(
    { _id: userId },
    { $set: { currentSessionId: sessionId } },
  ).exec();
}

export async function clearSessionIfCurrent(userId: string, sessionId: string) {
  await User.updateOne(
    { _id: userId, currentSessionId: sessionId },
    { $set: { currentSessionId: null } },
  ).exec();
}

export type UserActivityState = {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  lastCheckInAt: Date | null;
  activityTimeZone: string | null;
};

export async function findUserActivityState(
  userId: string,
): Promise<UserActivityState | null> {
  const row = await User.collection.findOne(
    { _id: new Types.ObjectId(userId) },
    {
      projection: {
        currentStreak: 1,
        longestStreak: 1,
        lastCheckInDate: 1,
        lastCheckInAt: 1,
        activityTimeZone: 1,
      },
    },
  );

  if (!row) {
    return null;
  }

  return {
    currentStreak: typeof row.currentStreak === "number" ? row.currentStreak : 0,
    longestStreak: typeof row.longestStreak === "number" ? row.longestStreak : 0,
    lastCheckInDate:
      typeof row.lastCheckInDate === "string" ? row.lastCheckInDate : null,
    lastCheckInAt: row.lastCheckInAt instanceof Date ? row.lastCheckInAt : null,
    activityTimeZone:
      typeof row.activityTimeZone === "string" ? row.activityTimeZone : null,
  };
}

export async function updateUserCheckIn(input: {
  userId: string;
  expectedLastCheckInDate: string | null;
  lastCheckInDate: string;
  lastCheckInAt: Date;
  currentStreak: number;
  longestStreak: number;
  activityTimeZone?: string;
}): Promise<UserActivityState | null> {
  const filter: Record<string, unknown> = {
    _id: new Types.ObjectId(input.userId),
  };

  if (input.expectedLastCheckInDate) {
    filter.lastCheckInDate = input.expectedLastCheckInDate;
  } else {
    filter.$or = [{ lastCheckInDate: null }, { lastCheckInDate: { $exists: false } }];
  }

  const $set: Record<string, unknown> = {
    lastCheckInDate: input.lastCheckInDate,
    lastCheckInAt: input.lastCheckInAt,
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
  };

  if (input.activityTimeZone) {
    $set.activityTimeZone = input.activityTimeZone;
  }

  const updated = await User.collection.findOneAndUpdate(
    filter,
    { $set },
    {
      returnDocument: "after",
      projection: {
        currentStreak: 1,
        longestStreak: 1,
        lastCheckInDate: 1,
        lastCheckInAt: 1,
        activityTimeZone: 1,
      },
    },
  );

  if (!updated) {
    return null;
  }

  return {
    currentStreak: typeof updated.currentStreak === "number" ? updated.currentStreak : 0,
    longestStreak: typeof updated.longestStreak === "number" ? updated.longestStreak : 0,
    lastCheckInDate:
      typeof updated.lastCheckInDate === "string" ? updated.lastCheckInDate : null,
    lastCheckInAt: updated.lastCheckInAt instanceof Date ? updated.lastCheckInAt : null,
    activityTimeZone:
      typeof updated.activityTimeZone === "string" ? updated.activityTimeZone : null,
  };
}
