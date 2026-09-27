"use client";

import { useEffect, useState } from "react";
import { formatWatchedHours } from "@/lib/activity/intensity";
import { uniqueWatchTotals } from "@/lib/activity/watch-totals";
import {
  DAILY_CHECK_IN_ERROR_EVENT,
  DAILY_CHECK_IN_EVENT,
} from "@/lib/activity/daily-check-in-client";
import type { ActivityOverview, CheckInResult } from "@/services/activity.service";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";
import { CheckInCoin } from "@/components/activity/check-in-coin";

function yearWatchTotal(activity: ActivityOverview): number {
  const days = activity.months.flatMap((month) =>
    month.weeks.flatMap((week) => week.filter((day) => day !== null)),
  );
  return uniqueWatchTotals(days).totalWatchedSeconds;
}

export function ActivityPanel({ initial }: { initial: ActivityOverview }) {
  const [activity, setActivity] = useState(initial);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    function onCheckIn(event: Event) {
      const detail = (event as CustomEvent<CheckInResult>).detail;
      if (!detail) {
        return;
      }
      setCheckInError(null);
      setActivity(detail.activity);
    }

    function onCheckInError(event: Event) {
      const message = (event as CustomEvent<string>).detail;
      setCheckInError(message || "Daily check-in could not be recorded.");
    }

    window.addEventListener(DAILY_CHECK_IN_EVENT, onCheckIn);
    window.addEventListener(DAILY_CHECK_IN_ERROR_EVENT, onCheckInError);
    return () => {
      window.removeEventListener(DAILY_CHECK_IN_EVENT, onCheckIn);
      window.removeEventListener(DAILY_CHECK_IN_ERROR_EVENT, onCheckInError);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Daily check-in
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
                {activity.currentStreak}
              </p>
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">day streak</p>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Longest streak {activity.longestStreak}{" "}
              {activity.longestStreak === 1 ? "day" : "days"}
            </p>
          </div>
          <p
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            role="status"
          >
            {activity.checkedInToday ? (
              <>
                <CheckInCoin className="size-6" />
                You&apos;re checked in for today.
              </>
            ) : checkInError ? (
              "Not checked in yet"
            ) : (
              "Checking in…"
            )}
          </p>
        </div>
        {checkInError ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
            {checkInError}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {formatWatchedHours(yearWatchTotal(activity))}
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
