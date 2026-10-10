"use client";

import { useMemo, useState } from "react";
import type { CertificateRequestView } from "@/services/certificate-review.service";
import type { CertificateReviewStatus } from "@/lib/certificates/review";
import { Button } from "@/components/ui/button";

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

const filterLabel: Record<Filter, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  all: "All",
};

const statusLabel: Record<Exclude<CertificateReviewStatus, "none">, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export function CertificateRequestList({
  requests: initialRequests,
}: {
  requests: CertificateRequestView[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<Filter>("pending");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      requests.filter((request) => filter === "all" || request.review === filter),
    [filter, requests],
  );
  const pendingCount = requests.filter((request) => request.review === "pending").length;

  async function decide(enrollmentId: string, decision: "approved" | "rejected") {
    setError(null);
    setPendingId(enrollmentId);
    try {
      const response = await fetch(`/api/admin/certificate-requests/${enrollmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { request: CertificateRequestView };
        error?: { message: string };
      };

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error?.message ?? "Could not update this request.");
        return;
      }

      setRequests((current) =>
        current.map((request) =>
          request.enrollmentId === enrollmentId ? payload.data!.request : request,
        ),
      );
      setConfirmRejectId(null);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter certificate requests">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              filter === value
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {filterLabel[value]}
            {value === "pending" ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">
            No {filter === "all" ? "" : `${filter} `}certificate requests
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Requests appear here after a learner finishes a course.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((request) => {
            const busy = pendingId === request.enrollmentId;
            const confirming = confirmRejectId === request.enrollmentId;
            return (
              <li
                key={request.enrollmentId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {statusLabel[request.review === "none" ? "pending" : request.review]}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {request.learnerName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {request.courseTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Duration {request.courseDurationLabel}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatWhen(request.requestedAt)}
                  </p>
                </div>
                {request.courseUrl ? (
                  <a
                    href={request.courseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block max-w-full truncate text-sm font-medium text-indigo-700 underline dark:text-indigo-400"
                  >
                    {request.courseUrl}
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Course link unavailable
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.review !== "approved" ? (
                    <Button
                      disabled={busy}
                      onClick={() => void decide(request.enrollmentId, "approved")}
                    >
                      {busy && !confirming ? "Saving…" : "Approve"}
                    </Button>
                  ) : null}
                  {request.review !== "rejected" ? (
                    confirming ? (
                      <>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void decide(request.enrollmentId, "rejected")}
                        >
                          {busy ? "Saving…" : "Confirm rejection"}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => setConfirmRejectId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setConfirmRejectId(request.enrollmentId);
                        }}
                      >
                        Reject
                      </Button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatWhen(value: string | null): string {
  if (!value) {
    return "Completed";
  }
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
