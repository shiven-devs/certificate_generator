import { Types } from "mongoose";
import { Enrollment } from "@/models/enrollment.model";
import "@/models/user.model";
import type { CourseDocument } from "@/models/course.model";
import { certificatePath } from "@/lib/certificates/path";
import {
  effectiveCertificateReview,
  type CertificateReviewStatus,
} from "@/lib/certificates/review";
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

export async function findCompletedEnrollmentByVerifyToken(token: string) {
  return Enrollment.findOne({
    certificateVerifyToken: token,
    status: "completed",
  })
    .populate<{ course: CourseDocument | null }>("course")
    .populate<{ user: { name: string } | null }>("user", "name")
    .exec();
}

export async function assignCertificateVerifyToken(
  enrollmentId: string,
  token: string,
) {
  return Enrollment.findOneAndUpdate(
    {
      _id: new Types.ObjectId(enrollmentId),
      $or: [
        { certificateVerifyToken: null },
        { certificateVerifyToken: { $exists: false } },
      ],
    },
    { $set: { certificateVerifyToken: token } },
    { new: true },
  ).exec();
}

export async function findCertificateVerifyToken(enrollmentId: string) {
  const row = await Enrollment.findById(new Types.ObjectId(enrollmentId))
    .select("certificateVerifyToken")
    .exec();
  return row?.certificateVerifyToken ?? null;
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
      certificateReview: "none",
      certificateRequestedAt: null,
      certificateReviewedAt: null,
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

export async function listCompletedEnrollmentsForReview() {
  return Enrollment.find({ status: "completed" })
    .populate<{ course: CourseDocument | null }>("course")
    .populate<{ user: { name: string } | null }>("user", "name")
    .exec();
}

export async function setCertificateReview(
  enrollmentId: string,
  decision: "approved" | "rejected",
  now: Date,
) {
  return Enrollment.findOneAndUpdate(
    {
      _id: new Types.ObjectId(enrollmentId),
      status: "completed",
    },
    {
      $set: {
        certificateReview: decision,
        certificateReviewedAt: now,
        certificateUrl:
          decision === "approved" ? certificatePath(enrollmentId) : null,
      },
    },
    { new: true },
  )
    .populate<{ course: CourseDocument | null }>("course")
    .populate<{ user: { name: string } | null }>("user", "name")
    .exec();
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
  certificateReview: CertificateReviewStatus;
  itemProgress: {
    youtubeVideoId: string;
    watchedSeconds: number;
    completed: boolean;
    lastPositionSeconds: number;
  }[];
};

type EnrollmentLike = {
  _id: { toString(): string };
  course: unknown;
  status: "in-progress" | "completed";
  completedAt?: Date | null;
  certificateUrl?: string | null;
  certificateReview?: string | null;
  itemProgress: {
    youtubeVideoId: string;
    watchedSeconds: number;
    completed: boolean;
    lastHeartbeatVideoTime?: number | null;
  }[];
};

export function toPublicEnrollment(
  enrollment: EnrollmentLike,
  courseId?: string,
): PublicEnrollment {
  const id = enrollment._id.toString();
  const certificateReview = effectiveCertificateReview({
    status: enrollment.status,
    certificateReview: enrollment.certificateReview,
    certificateUrl: enrollment.certificateUrl,
  });

  return {
    id,
    courseId: courseId ?? idFromRef(enrollment.course),
    status: enrollment.status,
    completedAt: enrollment.completedAt ?? null,
    certificateReview,
    certificateUrl:
      certificateReview === "approved"
        ? (enrollment.certificateUrl ?? certificatePath(id))
        : null,
    itemProgress: enrollment.itemProgress.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      watchedSeconds: item.watchedSeconds,
      completed: item.completed,
      lastPositionSeconds: item.lastHeartbeatVideoTime ?? 0,
    })),
  };
}

function idFromRef(ref: unknown): string {
  if (ref && typeof ref === "object" && "_id" in ref) {
    return String((ref as { _id: { toString(): string } })._id);
  }
  return String(ref);
}
