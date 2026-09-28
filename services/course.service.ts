import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { isYoutubeMusicUrl, parseYoutubeUrl } from "@/lib/youtube/url";
import type { CoursePreview } from "@/lib/youtube/types";
import { isPreviewEnrollable } from "@/lib/youtube/playable";
import { NOT_LEARNING_CONTENT_MESSAGE } from "@/lib/youtube/learning-eligibility";
import { resolveYoutubeMetadata, fetchVideoDescriptions } from "@/services/youtube.service";
import {
  createCourseFromPreview,
  findCourseById,
  findCourseByYoutubeId,
  isDuplicateKeyError,
  applyCourseItemDescriptions,
  toPublicCourse,
  type PublicCourse,
} from "@/repositories/course.repository";
import {
  createEnrollment,
  findEnrollment,
  toPublicEnrollment,
  type PublicEnrollment,
} from "@/repositories/enrollment.repository";
import { courseIdParamSchema } from "@/schemas/course.schema";

export async function previewCourseFromUrl(url: string): Promise<CoursePreview> {
  assertLearningSourceUrl(url);
  const ref = parseYoutubeUrl(url);
  return resolveYoutubeMetadata(ref);
}

export async function enrollFromUrl(
  userId: string,
  url: string,
): Promise<{ course: PublicCourse; enrollment: PublicEnrollment }> {
  assertLearningSourceUrl(url);
  const ref = parseYoutubeUrl(url);
  const preview = await resolveYoutubeMetadata(ref);
  assertEnrollable(preview);

  let course = await findCourseByYoutubeId(ref.youtubeId);

  if (!course) {
    try {
      course = await createCourseFromPreview(preview);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        course = await findCourseByYoutubeId(ref.youtubeId);
      } else {
        throw error;
      }
    }
  }

  if (!course) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      "Could not save this course. Please try again.",
      500,
    );
  }

  const enrollment = await createEnrollment(userId, course);
  return {
    course: toPublicCourse(course),
    enrollment: toPublicEnrollment(enrollment),
  };
}

export async function getCourseForUser(userId: string, courseId: string) {
  const parsed = courseIdParamSchema.safeParse({ courseId });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  const course = await findCourseById(parsed.data.courseId);
  if (!course) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  const enrollment = await findEnrollment(userId, courseId);
  if (!enrollment) {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      "You are not enrolled in this course.",
      403,
    );
  }

  const hydrated = await hydrateCourseDescriptions(course);

  return {
    course: toPublicCourse(hydrated),
    enrollment: toPublicEnrollment(enrollment),
  };
}

async function hydrateCourseDescriptions(course: Awaited<ReturnType<typeof findCourseById>>) {
  if (!course) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  const missingIds = course.items
    .filter((item) => !item.description)
    .map((item) => item.youtubeVideoId);
  if (missingIds.length === 0) {
    return course;
  }

  try {
    const descriptions = await fetchVideoDescriptions(missingIds);
    return await applyCourseItemDescriptions(course, descriptions);
  } catch {
    return course;
  }
}

function assertLearningSourceUrl(url: string) {
  if (isYoutubeMusicUrl(url)) {
    throw new AppError(
      ErrorCodes.NOT_LEARNING_CONTENT,
      NOT_LEARNING_CONTENT_MESSAGE,
      400,
    );
  }
}

function assertEnrollable(preview: CoursePreview) {
  if (!preview.learningEligible) {
    throw new AppError(
      ErrorCodes.NOT_LEARNING_CONTENT,
      NOT_LEARNING_CONTENT_MESSAGE,
      400,
    );
  }

  if (preview.enrollable && isPreviewEnrollable(preview.items)) {
    return;
  }

  const blocked = preview.items.filter((item) => !item.playable);
  const first = blocked[0];
  const message =
    first?.issue === "not_embeddable" && blocked.length === preview.items.length
      ? "This course includes a video that cannot be embedded, so it cannot be watched here."
      : "None of the videos in this playlist can be watched here. They may be private, deleted, live, or not embeddable.";

  throw new AppError(ErrorCodes.COURSE_NOT_PLAYABLE, message, 400);
}
