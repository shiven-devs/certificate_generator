"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";
import type { ActivityOverview } from "@/services/activity.service";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";

type CheckInResponse = { activity: ActivityOverview };

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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-56">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Daily check-in
          </p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {activity.currentStreak}
            </p>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">day streak</p>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Longest streak {activity.longestStreak}{" "}
            {activity.longestStreak === 1 ? "day" : "days"}
          </p>
          <div className="mt-4">
            {activity.checkedInToday ? (
              <p
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                role="status"
              >
                You&apos;re checked in for today.
              </p>
            ) : (
              <Button
                className="w-full sm:w-auto"
                disabled={isSubmitting}
                onClick={() => void onCheckIn()}
              >
                {isSubmitting ? "Checking in…" : "Check in today"}
              </Button>
            )}
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Learning heatmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activity.totalActiveDays} active{" "}
              {activity.totalActiveDays === 1 ? "day" : "days"} ·{" "}
              {activity.totalWatchedLabel} this year
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Darker squares mean more credited watch time that day.
          </p>
          <div
            className="mt-4"
            role="img"
            aria-label={`Watch-time heatmap for the past year. ${activity.totalActiveDays} days with credited watch time and a ${activity.currentStreak}-day check-in streak.`}
          >
            <ActivityHeatmap months={activity.months} />
          </div>
        </div>
      </div>
    </section>
  );
}
