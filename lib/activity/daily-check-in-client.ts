import { dateKeyInTimeZone } from "@/lib/activity/calendar";
import type { CheckInResult } from "@/services/activity.service";

export const DAILY_CHECK_IN_EVENT = "certitube:daily-check-in";
export const DAILY_CHECK_IN_ERROR_EVENT = "certitube:daily-check-in-error";

const TOAST_KEY = "certitube.daily-check-in-toast.v1";

export function clientTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function clientLocalDateKey(now = new Date()): string {
  return dateKeyInTimeZone(now, clientTimeZone());
}

export function hasShownCheckInToast(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.sessionStorage.getItem(TOAST_KEY) === clientLocalDateKey();
  } catch {
    return false;
  }
}

export function markCheckInToastShown(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(TOAST_KEY, clientLocalDateKey());
}

export function clearCheckInToastState(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(TOAST_KEY);
}

export function dispatchDailyCheckIn(result: CheckInResult): void {
  window.dispatchEvent(new CustomEvent<CheckInResult>(DAILY_CHECK_IN_EVENT, { detail: result }));
}

export function dispatchDailyCheckInError(message: string): void {
  window.dispatchEvent(new CustomEvent(DAILY_CHECK_IN_ERROR_EVENT, { detail: message }));
}
