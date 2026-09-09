import { Course, type CourseDocument } from "@/models/course.model";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import type { CoursePreview } from "@/lib/youtube/types";
import { isPreviewEnrollable, playablePreviewItems } from "@/lib/youtube/playable";

export async function findCourseByYoutubeId(youtubeId: string) {
  return Course.findOne({ youtubeId }).exec();
}

export async function findCourseById(courseId: string) {
  return Course.findById(courseId).exec();
}

export async function createCourseFromPreview(preview: CoursePreview) {
  const items = playablePreviewItems(preview.items);
  if (!isPreviewEnrollable(preview.items)) {
    throw new AppError(
      ErrorCodes.COURSE_NOT_PLAYABLE,
      "None of the videos in this playlist can be watched here.",
      400,
    );
  }

  return Course.create({
    youtubeId: preview.youtubeId,
    sourceType: preview.sourceType,
    title: preview.title,
    thumbnailUrl: preview.thumbnailUrl,
    items: items.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      title: item.title,
      description: item.description,
      durationSeconds: item.durationSeconds,
      order: item.order,
    })),
    totalDurationSeconds: items.reduce((sum, item) => sum + item.durationSeconds, 0),
  });
}

export async function applyCourseItemDescriptions(
  course: CourseDocument,
  descriptions: Map<string, string>,
): Promise<CourseDocument> {
  const nextItems = course.items.map((item) => {
    if (item.description) {
      return item;
    }
    const next = descriptions.get(item.youtubeVideoId);
    if (!next) {
      return item;
    }
    return {
      youtubeVideoId: item.youtubeVideoId,
      title: item.title,
      description: next,
      durationSeconds: item.durationSeconds,
      order: item.order,
    };
  });

  const changed = nextItems.some(
    (item, index) => item.description !== (course.items[index]?.description ?? ""),
  );
  if (!changed) {
    return course;
  }

  await Course.updateOne(
    { _id: course._id },
    { $set: { items: nextItems } },
  ).exec();

  const updated = await Course.findById(course._id).exec();
  return updated ?? course;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

export type PublicCourse = {
  id: string;
  youtubeId: string;
  sourceType: "video" | "playlist";
  title: string;
  thumbnailUrl: string;
  items: {
    youtubeVideoId: string;
    title: string;
    description: string;
    durationSeconds: number;
    order: number;
  }[];
  totalDurationSeconds: number;
};

export function toPublicCourse(course: CourseDocument): PublicCourse {
  return {
    id: course._id.toString(),
    youtubeId: course.youtubeId,
    sourceType: course.sourceType,
    title: course.title,
    thumbnailUrl: course.thumbnailUrl,
    items: course.items.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      title: item.title,
      description: item.description ?? "",
      durationSeconds: item.durationSeconds,
      order: item.order,
    })),
    totalDurationSeconds: course.totalDurationSeconds,
  };
}
