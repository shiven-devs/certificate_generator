import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  assignCertificateVerifyToken,
  findCertificateVerifyToken,
  findCompletedEnrollmentByVerifyToken,
  findEnrollmentByIdWithCourse,
} from "@/repositories/enrollment.repository";
import { listMyEnrollments } from "@/services/enrollment.service";
import type { CourseDocument } from "@/models/course.model";
import type { PublicUser } from "@/repositories/user.repository";
import {
  certificateParamsSchema,
  certificateVerifyTokenSchema,
} from "@/schemas/certificate.schema";
import {
  certificatePath,
  certificateVerifyUrl,
  youtubeThumbnailUrl,
} from "@/lib/certificates/path";
import { renderCertificatePdf } from "@/lib/certificates/render";
import { createCertificateVerifyToken } from "@/lib/certificates/token";
import { formatDuration } from "@/lib/youtube/duration";
import { formatWatchedHours } from "@/lib/activity/intensity";
import {
  certificateDownloadDeniedMessage,
  effectiveCertificateReview,
} from "@/lib/certificates/review";

export async function listMyCertificates(userId: string) {
  const enrollments = await listMyEnrollments(userId);
  return enrollments.filter((item) => item.enrollment.status === "completed");
}

export async function issueCertificate(input: {
  user: PublicUser;
  enrollmentId: string;
}) {
  const enrollment = await requireApprovedEnrollment(input);
  const url = enrollment.certificateUrl ?? certificatePath(enrollment._id.toString());
  if (!enrollment.certificateUrl) {
    enrollment.certificateUrl = url;
    await enrollment.save();
  }
  await ensureCertificateVerifyToken(enrollment._id.toString(), enrollment.certificateVerifyToken);
  return { certificateUrl: url };
}

export async function generateCertificatePdf(input: {
  user: PublicUser;
  enrollmentId: string;
  origin: string;
}): Promise<Uint8Array> {
  const enrollment = await requireApprovedEnrollment(input);
  const token = await ensureCertificateVerifyToken(
    enrollment._id.toString(),
    enrollment.certificateVerifyToken,
  );

  return renderCertificatePdf({
    learnerName: input.user.name,
    courseTitle: enrollment.course.title,
    completedAt: enrollment.completedAt ?? new Date(),
    verifyUrl: certificateVerifyUrl(input.origin, token),
  });
}

export type PublicCertificateDetails = {
  learnerName: string;
  courseTitle: string;
  completedAt: Date;
  courseHoursLabel: string;
  thumbnailUrl: string;
  videos: {
    youtubeVideoId: string;
    title: string;
    durationLabel: string;
    thumbnailUrl: string;
  }[];
};

export async function getPublicCertificateDetails(
  token: string,
): Promise<PublicCertificateDetails> {
  const parsed = certificateVerifyTokenSchema.safeParse({ token });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  const enrollment = await findCompletedEnrollmentByVerifyToken(parsed.data.token);
  if (!enrollment || !enrollment.course || !enrollment.user) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  if (
    effectiveCertificateReview({
      status: enrollment.status,
      certificateReview: enrollment.certificateReview,
      certificateUrl: enrollment.certificateUrl,
    }) !== "approved"
  ) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  const course = enrollment.course;
  return {
    learnerName: enrollment.user.name,
    courseTitle: course.title,
    completedAt: enrollment.completedAt ?? new Date(),
    courseHoursLabel: formatWatchedHours(course.totalDurationSeconds),
    thumbnailUrl: course.thumbnailUrl,
    videos: [...course.items]
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        youtubeVideoId: item.youtubeVideoId,
        title: item.title,
        durationLabel: formatDuration(item.durationSeconds),
        thumbnailUrl: youtubeThumbnailUrl(item.youtubeVideoId),
      })),
  };
}

export function certificateFilename(userName: string): string {
  const safe = userName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "learner"}-certitube-certificate.pdf`;
}

async function requireApprovedEnrollment(input: {
  user: PublicUser;
  enrollmentId: string;
}) {
  const parsed = certificateParamsSchema.safeParse({
    enrollmentId: input.enrollmentId,
  });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  const enrollment = await findEnrollmentByIdWithCourse(
    input.user.id,
    parsed.data.enrollmentId,
  );
  if (!enrollment || !enrollment.course) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  if (enrollment.status !== "completed") {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      "Complete the course before downloading a certificate.",
      403,
    );
  }

  const review = effectiveCertificateReview({
    status: enrollment.status,
    certificateReview: enrollment.certificateReview,
    certificateUrl: enrollment.certificateUrl,
  });
  if (review !== "approved") {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      certificateDownloadDeniedMessage(review),
      403,
    );
  }

  return enrollment as typeof enrollment & { course: CourseDocument };
}

async function ensureCertificateVerifyToken(
  enrollmentId: string,
  existing: string | null | undefined,
) {
  if (existing) {
    return existing;
  }

  const assigned = await assignCertificateVerifyToken(
    enrollmentId,
    createCertificateVerifyToken(),
  );
  if (assigned?.certificateVerifyToken) {
    return assigned.certificateVerifyToken;
  }

  const token = await findCertificateVerifyToken(enrollmentId);
  if (!token) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      "Could not prepare this certificate. Please try again.",
      500,
    );
  }
  return token;
}
