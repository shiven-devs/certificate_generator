"use client";

import { useEffect, useState } from "react";
import { DAILY_CHECK_IN_EVENT } from "@/lib/activity/daily-check-in-client";
import type { CheckInResult } from "@/services/activity.service";
import { CheckInCoin } from "@/components/activity/check-in-coin";

export function CheckInStreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    function onCheckIn(event: Event) {
      const detail = (event as CustomEvent<CheckInResult>).detail;
      if (!detail) {
        return;
      }
      setStreak(detail.activity.currentStreak);
    }

    window.addEventListener(DAILY_CHECK_IN_EVENT, onCheckIn);
    return () => window.removeEventListener(DAILY_CHECK_IN_EVENT, onCheckIn);
  }, []);

  if (streak === null) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 dark:text-slate-200"
      title={`${streak} day daily check-in streak`}
    >
      <CheckInCoin className="size-5" />
      <span aria-label={`${streak} day streak`}>{streak}</span>
    </span>
  );
}
