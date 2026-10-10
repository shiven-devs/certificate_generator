import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { formatDuration } from "@/lib/youtube/duration";
import {
  effectiveCertificateReview,
  youtubeCourseUrl,
  type CertificateReviewStatus,
} from "@/lib/certificates/review";
import type { CourseDocument } from "@/models/course.model";
import {
  listCompletedEnrollmentsForReview,
  setCertificateReview,
} from "@/repositories/enrollment.repository";

export type CertificateRequestView = {
  enrollmentId: string;
  learnerName: string;
  courseTitle: string;
  courseUrl: string | null;
  courseDurationLabel: string;
  review: CertificateReviewStatus;
  requestedAt: string | null;
  completedAt: string | null;
};

function toCertificateRequestView(row: {
  _id: { toString(): string };
  status: "in-progress" | "completed";
  certificateReview?: string | null;
  certificateUrl?: string | null;
  certificateRequestedAt?: Date | null;
  completedAt?: Date | null;
  course: CourseDocument | null;
  user: { name: string } | null;
}): CertificateRequestView | null {
  if (!row.course || !row.user?.name) {
    return null;
  }

  const review = effectiveCertificateReview({
    status: row.status,
    certificateReview: row.certificateReview,
    certificateUrl: row.certificateUrl,
  });
  const requestedAt = row.certificateRequestedAt ?? row.completedAt ?? null;

  return {
    enrollmentId: row._id.toString(),
    learnerName: row.user.name,
    courseTitle: row.course.title,
    courseUrl: youtubeCourseUrl(row.course.sourceType, row.course.youtubeId),
    courseDurationLabel: formatDuration(row.course.totalDurationSeconds),
    review,
    requestedAt: requestedAt ? requestedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export async function listCertificateRequests(): Promise<CertificateRequestView[]> {
  const rows = await listCompletedEnrollmentsForReview();
  const requests = rows.flatMap((row) => {
    const view = toCertificateRequestView(row);
    if (!view || view.review === "none") {
      return [];
    }

    return [view];
  });

  const rank: Record<CertificateReviewStatus, number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
    none: 3,
  };

  return requests.sort((left, right) => {
    const byStatus = rank[left.review] - rank[right.review];
    if (byStatus !== 0) {
      return byStatus;
    }
    return (right.requestedAt ?? "").localeCompare(left.requestedAt ?? "");
  });
}

export async function decideCertificateRequest(
  enrollmentId: string,
  decision: "approved" | "rejected",
): Promise<CertificateRequestView> {
  const updated = await setCertificateReview(enrollmentId, decision, new Date());
  const view = updated ? toCertificateRequestView(updated) : null;
  if (!view) {
    throw new AppError(
      ErrorCodes.NOT_FOUND,
      "Certificate request not found.",
      404,
    );
  }

  return view;
}
