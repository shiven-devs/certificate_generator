import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  effectiveCertificateReview,
  youtubeCourseUrl,
  type CertificateReviewStatus,
} from "@/lib/certificates/review";
import {
  listCompletedEnrollmentsForReview,
  setCertificateReview,
} from "@/repositories/enrollment.repository";

export type CertificateRequestView = {
  enrollmentId: string;
  learnerName: string;
  courseTitle: string;
  courseUrl: string | null;
  review: CertificateReviewStatus;
  requestedAt: string | null;
  completedAt: string | null;
};

export async function listCertificateRequests(): Promise<CertificateRequestView[]> {
  const rows = await listCompletedEnrollmentsForReview();
  const requests = rows.flatMap((row) => {
    if (!row.course || !row.user?.name) {
      return [];
    }

    const review = effectiveCertificateReview({
      status: row.status,
      certificateReview: row.certificateReview,
      certificateUrl: row.certificateUrl,
    });
    if (review === "none") {
      return [];
    }

    const requestedAt = row.certificateRequestedAt ?? row.completedAt ?? null;
    return [
      {
        enrollmentId: row._id.toString(),
        learnerName: row.user.name,
        courseTitle: row.course.title,
        courseUrl: youtubeCourseUrl(row.course.sourceType, row.course.youtubeId),
        review,
        requestedAt: requestedAt ? requestedAt.toISOString() : null,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      },
    ];
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
  if (!updated || !updated.course || !updated.user?.name) {
    throw new AppError(
      ErrorCodes.NOT_FOUND,
      "Certificate request not found.",
      404,
    );
  }

  const review = effectiveCertificateReview({
    status: updated.status,
    certificateReview: updated.certificateReview,
    certificateUrl: updated.certificateUrl,
  });
  const requestedAt = updated.certificateRequestedAt ?? updated.completedAt ?? null;

  return {
    enrollmentId: updated._id.toString(),
    learnerName: updated.user.name,
    courseTitle: updated.course.title,
    courseUrl: youtubeCourseUrl(updated.course.sourceType, updated.course.youtubeId),
    review,
    requestedAt: requestedAt ? requestedAt.toISOString() : null,
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
  };
}
