import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  decideProgressCredit,
  isCompletedByWatchTime,
  rejectProgress,
} from "@/lib/progress/rules";
import { isVideoUnlocked } from "@/lib/progress/unlock";
import { Enrollment } from "@/models/enrollment.model";
import {
  findEnrollmentWithCourse,
  toPublicEnrollment,
} from "@/repositories/enrollment.repository";
import { courseIdParamSchema } from "@/schemas/course.schema";
import type { HeartbeatInput } from "@/schemas/progress.schema";
import { certificatePath } from "@/lib/certificates/path";

export async function recordHeartbeat(
  userId: string,
  courseId: string,
  input: HeartbeatInput,
) {
  const parsed = courseIdParamSchema.safeParse({ courseId });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Course not found.", 404);
  }

  const enrollment = await findEnrollmentWithCourse(userId, parsed.data.courseId);
  if (!enrollment || !enrollment.course) {
    throw new AppError(
      ErrorCodes.NOT_FOUND,
      "You are not enrolled in this course.",
      404,
    );
  }

  const course = enrollment.course;
  const courseItemIndex = course.items.findIndex(
    (item) => item.youtubeVideoId === input.youtubeVideoId,
  );
  if (courseItemIndex === -1) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Video not found in this course.", 404);
  }

  const progressIndex = enrollment.itemProgress.findIndex(
    (item) => item.youtubeVideoId === input.youtubeVideoId,
  );
  if (progressIndex === -1) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      "Course progress is not initialized correctly.",
      500,
    );
  }

  if (!isVideoUnlocked(course.items, enrollment.itemProgress, input.youtubeVideoId)) {
    throw new AppError(
      ErrorCodes.VIDEO_LOCKED,
      "Complete the previous lesson before watching this one.",
      403,
    );
  }

  const now = new Date();
  const progress = enrollment.itemProgress[progressIndex];
  const courseItem = course.items[courseItemIndex];
  const decision = decideProgressCredit({
    previousVideoTime: progress.lastHeartbeatVideoTime ?? null,
    previousServerTime: progress.lastHeartbeatAt ?? null,
    currentVideoTime: input.currentTime,
    currentServerTime: now,
    reportedPlaybackRate: input.playbackRate,
    existingWatchedSeconds: progress.watchedSeconds,
    durationSeconds: courseItem.durationSeconds,
  });

  const nextWatchedSeconds = decision.accepted
    ? Math.min(
        courseItem.durationSeconds,
        progress.watchedSeconds + decision.creditedSeconds,
      )
    : progress.watchedSeconds;
  const itemCompleted =
    progress.completed ||
    isCompletedByWatchTime(nextWatchedSeconds, courseItem.durationSeconds);
  const courseCompleted = enrollment.itemProgress.every((item, index) =>
    index === progressIndex ? itemCompleted : item.completed,
  );
  const nextVideoTime = Math.min(
    Math.max(input.currentTime, 0),
    courseItem.durationSeconds,
  );
  const certificateUrl =
    enrollment.certificateUrl ?? certificatePath(enrollment._id.toString());

  const updated = await Enrollment.findOneAndUpdate(
    {
      _id: enrollment._id,
      user: enrollment.user,
      itemProgress: {
        $elemMatch: {
          youtubeVideoId: input.youtubeVideoId,
          lastHeartbeatAt: progress.lastHeartbeatAt ?? null,
        },
      },
    },
    {
      $set: {
        "itemProgress.$.watchedSeconds": nextWatchedSeconds,
        "itemProgress.$.completed": itemCompleted,
        "itemProgress.$.lastHeartbeatAt": now,
        "itemProgress.$.lastHeartbeatVideoTime": nextVideoTime,
        ...(courseCompleted
          ? {
              status: "completed" as const,
              completedAt: enrollment.completedAt ?? now,
              certificateUrl,
            }
          : {}),
      },
    },
    { new: true },
  )
    .populate("course")
    .exec();

  if (!updated) {
    const latest = await findEnrollmentWithCourse(userId, parsed.data.courseId);
    if (!latest || !latest.course) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        "You are not enrolled in this course.",
        404,
      );
    }

    return {
      decision: rejectProgress(
        "stale_heartbeat",
        latest.itemProgress[progressIndex]?.watchedSeconds ?? progress.watchedSeconds,
        courseItem.durationSeconds,
      ),
      enrollment: toPublicEnrollment(latest, latest.course._id.toString()),
    };
  }

  return {
    decision: {
      ...decision,
      completed: itemCompleted,
    },
    enrollment: toPublicEnrollment(updated, course._id.toString()),
  };
}
