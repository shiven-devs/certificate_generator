import { CERTIFICATE_REJECTED_MESSAGE } from "@/lib/support";

export const CERTIFICATE_REVIEW_STATUSES = [
  "none",
  "pending",
  "approved",
  "rejected",
] as const;

export type CertificateReviewStatus = (typeof CERTIFICATE_REVIEW_STATUSES)[number];

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;

export function effectiveCertificateReview(input: {
  status: "in-progress" | "completed";
  certificateReview?: string | null;
  certificateUrl?: string | null;
}): CertificateReviewStatus {
  if (
    input.certificateReview === "pending" ||
    input.certificateReview === "approved" ||
    input.certificateReview === "rejected"
  ) {
    return input.certificateReview;
  }

  // Certificates issued before review existed stay downloadable.
  if (input.status === "completed" && input.certificateUrl) {
    return "approved";
  }

  if (input.status === "completed") {
    return "pending";
  }

  return "none";
}

export function certificateFieldsOnCompletion(input: {
  courseCompleted: boolean;
  now: Date;
  completedAt: Date | null;
  certificateReview?: string | null;
  certificateUrl?: string | null;
}): Record<string, unknown> {
  if (!input.courseCompleted) {
    return {};
  }

  const completed = {
    status: "completed" as const,
    completedAt: input.completedAt ?? input.now,
  };

  if (
    input.certificateReview === "pending" ||
    input.certificateReview === "approved" ||
    input.certificateReview === "rejected"
  ) {
    return completed;
  }

  if (input.certificateUrl) {
    return { ...completed, certificateReview: "approved" as const };
  }

  return {
    ...completed,
    certificateReview: "pending" as const,
    certificateRequestedAt: input.now,
  };
}

export function youtubeCourseUrl(
  sourceType: "video" | "playlist",
  youtubeId: string,
): string | null {
  if (sourceType === "video" && VIDEO_ID.test(youtubeId)) {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  if (sourceType === "playlist" && PLAYLIST_ID.test(youtubeId)) {
    return `https://www.youtube.com/playlist?list=${youtubeId}`;
  }

  return null;
}

export function certificateDownloadDeniedMessage(
  review: CertificateReviewStatus,
): string {
  if (review === "pending") {
    return "Your certificate request is waiting for review.";
  }

  if (review === "rejected") {
    return CERTIFICATE_REJECTED_MESSAGE;
  }

  return "Complete the course before downloading a certificate.";
}
