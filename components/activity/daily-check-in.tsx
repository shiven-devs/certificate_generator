"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apiRequest, isSessionInvalidated, type ClientApiError } from "@/lib/api/client";
import { SESSION_KICK_LOGIN_PATH } from "@/lib/auth/constants";
import { useIsClient } from "@/hooks/use-is-client";
import {
  clientTimeZone,
  dispatchDailyCheckIn,
  dispatchDailyCheckInError,
  hasShownCheckInToast,
  markCheckInToastShown,
} from "@/lib/activity/daily-check-in-client";
import type { CheckInResult } from "@/services/activity.service";
import { CheckInCoin } from "@/components/activity/check-in-coin";

class CheckInRequestError extends Error {
  readonly apiError: ClientApiError;

  constructor(apiError: ClientApiError) {
    super(apiError.message);
    this.name = "CheckInRequestError";
    this.apiError = apiError;
  }
}

let inFlight: Promise<CheckInResult | null> | null = null;
let cachedResult: CheckInResult | null = null;

export function resetDailyCheckInRequestCache(): void {
  inFlight = null;
  cachedResult = null;
}

async function requestDailyCheckIn(): Promise<CheckInResult | null> {
  if (cachedResult) {
    return cachedResult;
  }

  if (!inFlight) {
    inFlight = (async () => {
      const response = await apiRequest<CheckInResult>("/api/activity/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone: clientTimeZone() }),
      });
      if (!response.ok) {
        inFlight = null;
        throw new CheckInRequestError(response.error);
      }
      cachedResult = response.data;
      return cachedResult;
    })();
  }

  return inFlight;
}

export function DailyCheckIn() {
  const router = useRouter();
  const isClient = useIsClient();
  const [toast, setToast] = useState<CheckInResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    let hideTimer: number | undefined;

    async function run() {
      try {
        const result = await requestDailyCheckIn();
        if (!result || cancelled) {
          return;
        }

        dispatchDailyCheckIn(result);

        if (!result.awarded || hasShownCheckInToast()) {
          return;
        }

        setToast(result);
        hideTimer = window.setTimeout(() => {
          markCheckInToastShown();
          setToast(null);
        }, 4000);
      } catch (error) {
        const apiError = error instanceof CheckInRequestError ? error.apiError : null;
        if (apiError && isSessionInvalidated(apiError)) {
          router.replace(SESSION_KICK_LOGIN_PATH);
          router.refresh();
          return;
        }
        if (!cancelled) {
          dispatchDailyCheckInError(
            apiError?.message ?? "Daily check-in could not be recorded. Try refreshing.",
          );
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
    };
  }, [router]);

  if (!isClient || !toast) {
    return null;
  }

  const nextStreak = toast.activity.currentStreak;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[18vh] z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="check-in-coin-pop pointer-events-auto flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-lg dark:border-amber-900/60 dark:bg-slate-900"
      >
        <CheckInCoin className="size-12 shrink-0" />
        <div>
          <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            +1 daily check-in
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {nextStreak} day{nextStreak === 1 ? "" : "s"} streak
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
