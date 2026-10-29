import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { formatWatchedHours } from "@/lib/activity/intensity";
import {
  completedLessons,
  completedWatchSeconds,
  isCourseCompleted,
  type ProfileLesson,
} from "@/lib/profile/completion";
import { profileHandleCandidates } from "@/lib/profile/handle";
import { courseCreditedPercent } from "@/lib/progress/percent";
import { youtubeCourseUrl } from "@/lib/certificates/review";
import {
  listEnrollmentsForUser,
  setEnrollmentProfileVisibility,
} from "@/repositories/enrollment.repository";
import {
  claimProfileHandle,
  findUserProfileByHandle,
  findUserProfileState,
  updateProfileSettings,
  type UserProfileState,
} from "@/repositories/user.repository";
import {
  getActivityOverviewForProfile,
  type ActivityOverview,
} from "@/services/activity.service";
import {
  profileCourseParamSchema,
  profileCourseVisibilitySchema,
  profileHandleParamSchema,
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/schemas/profile.schema";

export type ProfileCourse = {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string | null;
  lessonCount: number;
  completedLessonCount: number;
  creditedPercent: number;
  completed: boolean;
  completedAt: Date | null;
  watchedLabel: string;
  lessons: ProfileLesson[];
};

export type ProfileSummary = {
  handle: string;
  name: string;
  headline: string | null;
  memberSince: Date | null;
  currentStreak: number;
  longestStreak: number;
  completedCourseCount: number;
  completedLessonCount: number;
  showHeatmap: boolean;
};

export type PublicProfile = {
  profile: ProfileSummary;
  courses: ProfileCourse[];
  activity: ActivityOverview | null;
};

export type MyProfile = {
  profile: ProfileSummary;
  /** Every course with credited lessons, including the ones hidden from the profile. */
  courses: (ProfileCourse & { visible: boolean })[];
};

export async function getMyProfile(userId: string): Promise<MyProfile> {
  const user = await ensureProfileHandle(userId);
  const courses = await listProfileCourses(userId, { includeHidden: true });

  return {
    profile: toProfileSummary(
      user,
      courses.filter((course) => course.visible),
    ),
    courses,
  };
}

export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  const parsed = profileHandleParamSchema.safeParse({ handle });
  if (!parsed.success) {
    return null;
  }

  const user = await findUserProfileByHandle(parsed.data.handle);
  if (!user || !user.profileHandle) {
    return null;
  }

  const courses = await listProfileCourses(user.id, { includeHidden: false });
  const profile = toProfileSummary(user, courses);

  return {
    profile,
    courses,
    activity: profile.showHeatmap
      ? await getActivityOverviewForProfile(user.id)
      : null,
  };
}

export async function updateMyProfileSettings(
  userId: string,
  input: ProfileSettingsInput,
): Promise<MyProfile> {
  const settings = profileSettingsSchema.parse(input);
  await ensureProfileHandle(userId);

  const updated = await updateProfileSettings(userId, {
    profileShowHeatmap: settings.showHeatmap,
    profileHeadline:
      settings.headline === undefined ? undefined : settings.headline || null,
  });
  if (!updated) {
    throw new AppError(ErrorCodes.UNAUTHENTICATED, "You need to sign in to continue.", 401);
  }

  return getMyProfile(userId);
}

export async function setMyProfileCourseVisibility(
  userId: string,
  enrollmentId: string,
  input: { visible: boolean },
): Promise<MyProfile> {
  const params = profileCourseParamSchema.safeParse({ enrollmentId });
  if (!params.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  const { visible } = profileCourseVisibilitySchema.parse(input);
  const updated = await setEnrollmentProfileVisibility(
    userId,
    params.data.enrollmentId,
    visible,
  );
  if (!updated) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  return getMyProfile(userId);
}

/**
 * Gives the user a handle the first time they open their profile, so handles
 * exist for accounts created before profiles did.
 */
export async function ensureProfileHandle(userId: string): Promise<UserProfileState> {
  const user = await findUserProfileState(userId);
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHENTICATED, "You need to sign in to continue.", 401);
  }
  if (user.profileHandle) {
    return user;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidates = profileHandleCandidates({
      name: user.name,
      email: user.email,
      attempt,
    });

    for (const candidate of candidates) {
      const claimed = await claimProfileHandle(userId, candidate);
      if (claimed?.profileHandle) {
        return claimed;
      }

      // A concurrent request may have claimed a handle for this user already.
      const latest = await findUserProfileState(userId);
      if (latest?.profileHandle) {
        return latest;
      }
    }
  }

  throw new AppError(
    ErrorCodes.INTERNAL_ERROR,
    "Could not prepare your profile link. Please try again.",
    500,
  );
}

async function listProfileCourses(
  userId: string,
  options: { includeHidden: boolean },
): Promise<(ProfileCourse & { visible: boolean })[]> {
  const rows = await listEnrollmentsForUser(userId);

  return rows.flatMap((row) => {
    const course = row.course;
    if (!course) {
      return [];
    }

    const visible = row.profileHidden !== true;
    if (!visible && !options.includeHidden) {
      return [];
    }

    const lessons = completedLessons(course.items, row.itemProgress);
    if (lessons.length === 0) {
      return [];
    }

    return [
      {
        enrollmentId: row._id.toString(),
        courseId: course._id.toString(),
        title: course.title,
        thumbnailUrl: course.thumbnailUrl,
        youtubeUrl: youtubeCourseUrl(course.sourceType, course.youtubeId),
        lessonCount: course.items.length,
        completedLessonCount: lessons.length,
        creditedPercent: courseCreditedPercent(course.items, row.itemProgress),
        completed: isCourseCompleted(course.items, row.itemProgress),
        completedAt: row.completedAt ?? null,
        watchedLabel: formatWatchedHours(
          completedWatchSeconds(course.items, row.itemProgress),
        ),
        lessons,
        visible,
      },
    ];
  });
}

function toProfileSummary(
  user: UserProfileState,
  visibleCourses: ProfileCourse[],
): ProfileSummary {
  return {
    handle: user.profileHandle ?? "",
    name: user.name,
    headline: user.profileHeadline,
    memberSince: user.createdAt,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    completedCourseCount: visibleCourses.filter((course) => course.completed).length,
    completedLessonCount: visibleCourses.reduce(
      (sum, course) => sum + course.completedLessonCount,
      0,
    ),
    showHeatmap: user.profileShowHeatmap,
  };
}
