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

export async function lockActivityTimeZone(
  userId: string,
  timeZone: string,
): Promise<void> {
  await User.collection.updateOne(
    {
      _id: new Types.ObjectId(userId),
      $or: [{ activityTimeZone: null }, { activityTimeZone: { $exists: false } }],
    },
    { $set: { activityTimeZone: timeZone } },
  );
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

export type UserProfileState = {
  id: string;
  name: string;
  /** Used only to seed a handle; never part of a public profile payload. */
  email: string;
  profileHandle: string | null;
  profileShowHeatmap: boolean;
  profileHeadline: string | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date | null;
};

const PROFILE_PROJECTION = {
  name: 1,
  email: 1,
  profileHandle: 1,
  profileShowHeatmap: 1,
  profileHeadline: 1,
  currentStreak: 1,
  longestStreak: 1,
  createdAt: 1,
} as const;

function toUserProfileState(row: Record<string, unknown>): UserProfileState {
  return {
    id: String(row._id),
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : "",
    profileHandle:
      typeof row.profileHandle === "string" && row.profileHandle ? row.profileHandle : null,
    // Profiles created before this field existed still show the heatmap.
    profileShowHeatmap: row.profileShowHeatmap !== false,
    profileHeadline:
      typeof row.profileHeadline === "string" && row.profileHeadline
        ? row.profileHeadline
        : null,
    currentStreak: typeof row.currentStreak === "number" ? row.currentStreak : 0,
    longestStreak: typeof row.longestStreak === "number" ? row.longestStreak : 0,
    createdAt: row.createdAt instanceof Date ? row.createdAt : null,
  };
}

export async function findUserProfileState(
  userId: string,
): Promise<UserProfileState | null> {
  const row = await User.collection.findOne(
    { _id: new Types.ObjectId(userId) },
    { projection: PROFILE_PROJECTION },
  );
  return row ? toUserProfileState(row) : null;
}

export async function findUserProfileByHandle(
  handle: string,
): Promise<UserProfileState | null> {
  const row = await User.collection.findOne(
    { profileHandle: handle },
    { projection: PROFILE_PROJECTION },
  );
  return row ? toUserProfileState(row) : null;
}

/**
 * Claims a handle only while the user has none, so a concurrent request cannot
 * hand the same user two handles. Returns null when the handle is taken.
 */
export async function claimProfileHandle(
  userId: string,
  handle: string,
): Promise<UserProfileState | null> {
  try {
    const updated = await User.collection.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
        $or: [{ profileHandle: null }, { profileHandle: { $exists: false } }],
      },
      { $set: { profileHandle: handle } },
      { returnDocument: "after", projection: PROFILE_PROJECTION },
    );
    return updated ? toUserProfileState(updated) : null;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateProfileSettings(
  userId: string,
  settings: { profileShowHeatmap?: boolean; profileHeadline?: string | null },
): Promise<UserProfileState | null> {
  const $set: Record<string, unknown> = {};
  if (settings.profileShowHeatmap !== undefined) {
    $set.profileShowHeatmap = settings.profileShowHeatmap;
  }
  if (settings.profileHeadline !== undefined) {
    $set.profileHeadline = settings.profileHeadline;
  }

  if (Object.keys($set).length === 0) {
    return findUserProfileState(userId);
  }

  const updated = await User.collection.findOneAndUpdate(
    { _id: new Types.ObjectId(userId) },
    { $set },
    { returnDocument: "after", projection: PROFILE_PROJECTION },
  );
  return updated ? toUserProfileState(updated) : null;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
