export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

const TWENTY_MINUTES = 20 * 60;
const ONE_HOUR = 60 * 60;
const TWO_HOURS = 2 * 60 * 60;

export function intensityLevelFromWatchedSeconds(seconds: number): IntensityLevel {
  if (seconds <= 0) {
    return 0;
  }
  if (seconds < TWENTY_MINUTES) {
    return 1;
  }
  if (seconds < ONE_HOUR) {
    return 2;
  }
  if (seconds < TWO_HOURS) {
    return 3;
  }
  return 4;
}

export function formatWatchedHours(seconds: number): string {
  const safe = Number(seconds);
  if (!Number.isFinite(safe) || safe <= 0) {
    return "0 hours";
  }

  const hours = safe / ONE_HOUR;
  // One decimal would round sub-3-minute days to "0 hours" while still
  // counting those seconds in the yearly total.
  if (hours < 0.05) {
    const minutes = Math.max(1, Math.round(safe / 60));
    return `${minutes} min`;
  }

  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? "hour" : "hours"}`;
}

export function formatWatchedDuration(seconds: number): string {
  if (seconds <= 0) {
    return "no watch time";
  }
  if (seconds < 60) {
    return `${seconds} sec watched`;
  }
  if (seconds < ONE_HOUR) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min watched`;
  }

  const hours = seconds / ONE_HOUR;
  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? "hour" : "hours"} watched`;
}
