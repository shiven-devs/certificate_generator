import { SUPPORT_EMAIL } from "@/lib/support";
import type { CertificateReviewStatus } from "@/lib/certificates/review";

export function CertificateStatus({
  review,
  certificateUrl,
  compact = false,
}: {
  review: CertificateReviewStatus;
  certificateUrl: string | null;
  compact?: boolean;
}) {
  if (review === "approved" && certificateUrl) {
    return (
      <a
        href={certificateUrl}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Download certificate
      </a>
    );
  }

  if (review === "pending") {
    return (
      <p className={compact ? "text-sm text-slate-600 dark:text-slate-400" : "mt-1 text-sm text-emerald-900 dark:text-emerald-200"}>
        Your certificate request is waiting for review.
      </p>
    );
  }

  if (review === "rejected") {
    return (
      <p className={compact ? "text-sm text-slate-600 dark:text-slate-400" : "mt-1 text-sm text-slate-700 dark:text-slate-300"}>
        This certificate request was not approved. Contact the developer at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-indigo-700 underline dark:text-indigo-400"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    );
  }

  return null;
}
