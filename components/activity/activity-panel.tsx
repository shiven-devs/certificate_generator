"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";
import type { ActivityOverview } from "@/services/activity.service";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";

type CheckInResponse = { activity: ActivityOverview };

function watchedAmount(seconds: number): string {
  if (seconds <= 0) {
    return "0 hours";
  }
  if (seconds < 3600) {
    return `${Math.max(1, Math.round(seconds / 60))} min`;
  }
  const hours = seconds / 3600;
  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? "hour" : "hours"}`;
}

export function ActivityPanel({ initial }: { initial: ActivityOverview }) {
  const redirectIfKicked = useSessionErrorRedirect();
  const [activity, setActivity] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onCheckIn() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiRequest<CheckInResponse>("/api/activity/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!result.ok) {
        if (redirectIfKicked(result.error)) {
          return;
        }
        setError(result.error.message);
        return;
      }
      setActivity(result.data.activity);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Daily check-in
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {activity.currentStreak}
              </p>
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">day streak</p>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Longest streak {activity.longestStreak}{" "}
              {activity.longestStreak === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="sm:text-right">
            {activity.checkedInToday ? (
              <p
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                role="status"
              >
                You&apos;re checked in for today.
              </p>
            ) : (
              <Button disabled={isSubmitting} onClick={() => void onCheckIn()}>
                {isSubmitting ? "Checking in…" : "Check in today"}
              </Button>
            )}
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {watchedAmount(activity.totalWatchedSeconds)}
            </span>{" "}
            watched in the past one year
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total active days:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {activity.totalActiveDays}
            </span>
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Darker squares mean more credited watch time that day. Scroll sideways to
          see earlier months.
        </p>
        <div className="mt-5">
          <ActivityHeatmap months={activity.months} />
        </div>
      </section>
    </div>
  );
}
