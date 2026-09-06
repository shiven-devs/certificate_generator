import { Types } from "mongoose";
import { Enrollment } from "@/models/enrollment.model";
import type { CourseDocument } from "@/models/course.model";
import { isDuplicateKeyError } from "@/repositories/course.repository";

export async function findEnrollment(userId: string, courseId: string) {
  return Enrollment.findOne({
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId),
  }).exec();
}

export async function findEnrollmentWithCourse(userId: string, courseId: string) {
  return Enrollment.findOne({
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId),
  })
    .populate<{ course: CourseDocument | null }>("course")
    .exec();
}

export async function findEnrollmentByIdWithCourse(
  userId: string,
  enrollmentId: string,
) {
  return Enrollment.findOne({
    _id: new Types.ObjectId(enrollmentId),
    user: new Types.ObjectId(userId),
  })
    .populate<{ course: CourseDocument | null }>("course")
    .exec();
}

export async function createEnrollment(
  userId: string,
  course: CourseDocument,
) {
  try {
    return await Enrollment.create({
      user: new Types.ObjectId(userId),
      course: course._id,
      itemProgress: course.items.map((item) => ({
        youtubeVideoId: item.youtubeVideoId,
        watchedSeconds: 0,
        completed: false,
        lastHeartbeatAt: null,
        lastHeartbeatVideoTime: null,
      })),
      status: "in-progress",
      completedAt: null,
      certificateUrl: null,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await findEnrollment(userId, course._id.toString());
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

export async function listEnrollmentsForUser(userId: string) {
  return Enrollment.find({ user: new Types.ObjectId(userId) })
    .populate<{ course: CourseDocument | null }>("course")
    .sort({ _id: -1 })
    .exec();
}

export type PublicEnrollment = {
  id: string;
  courseId: string;
  status: "in-progress" | "completed";
  completedAt: Date | null;
  certificateUrl: string | null;
  itemProgress: {
    youtubeVideoId: string;
    watchedSeconds: number;
    completed: boolean;
  }[];
};

type EnrollmentLike = {
  _id: { toString(): string };
  course: unknown;
  status: "in-progress" | "completed";
  completedAt?: Date | null;
  certificateUrl?: string | null;
  itemProgress: {
    youtubeVideoId: string;
    watchedSeconds: number;
    completed: boolean;
  }[];
};

export function toPublicEnrollment(
  enrollment: EnrollmentLike,
  courseId?: string,
): PublicEnrollment {
  return {
    id: enrollment._id.toString(),
    courseId: courseId ?? idFromRef(enrollment.course),
    status: enrollment.status,
    completedAt: enrollment.completedAt ?? null,
    certificateUrl: enrollment.certificateUrl ?? null,
    itemProgress: enrollment.itemProgress.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      watchedSeconds: item.watchedSeconds,
      completed: item.completed,
    })),
  };
}

function idFromRef(ref: unknown): string {
  if (ref && typeof ref === "object" && "_id" in ref) {
    return String((ref as { _id: { toString(): string } })._id);
  }
  return String(ref);
}
