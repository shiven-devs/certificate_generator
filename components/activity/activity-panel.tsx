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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {watchedAmount(activity.totalWatchedSeconds)}
          </span>
          {" "}
          watched in the past one year
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            Total active days:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {activity.totalActiveDays}
            </span>
          </p>
          <p>
            Max streak:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {activity.longestStreak}
            </span>
          </p>
          <p>
            Current:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {activity.currentStreak}
            </span>
          </p>
          {activity.checkedInToday ? (
            <p
              className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              role="status"
            >
              Checked in today
            </p>
          ) : (
            <Button
              className="h-8 px-3 text-xs"
              disabled={isSubmitting}
              onClick={() => void onCheckIn()}
            >
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
      <div
        className="mt-5"
        role="img"
        aria-label={`Watch-time heatmap for the past year. ${activity.totalActiveDays} days with credited watch time. Current check-in streak ${activity.currentStreak} days.`}
      >
        <ActivityHeatmap months={activity.months} />
      </div>
    </section>
  );
}
