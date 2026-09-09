const END_REWIND_SECONDS = 3;
const RELOAD_RESET_SECONDS = 5;
const SAVED_POSITION_MINIMUM = 15;
const RELOAD_GAP_MS = 30_000;

export function resumePositionSeconds(
  lastPositionSeconds: number | null | undefined,
  durationSeconds: number,
): number {
  if (
    !Number.isFinite(lastPositionSeconds) ||
    lastPositionSeconds == null ||
    lastPositionSeconds <= 1
  ) {
    return 0;
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  if (lastPositionSeconds >= durationSeconds - END_REWIND_SECONDS) {
    return 0;
  }

  return Math.min(lastPositionSeconds, durationSeconds);
}

export function preserveResumePosition(
  lastPositionSeconds: number | null | undefined,
  lastHeartbeatAt: Date | null | undefined,
  currentTime: number,
  durationSeconds: number,
  now: Date,
): number {
  const clampedCurrent = clamp(currentTime, 0, durationSeconds);
  const lastPosition =
    lastPositionSeconds == null || !Number.isFinite(lastPositionSeconds)
      ? null
      : clamp(lastPositionSeconds, 0, durationSeconds);

  if (
    lastPosition != null &&
    lastHeartbeatAt &&
    clampedCurrent <= RELOAD_RESET_SECONDS &&
    lastPosition >= SAVED_POSITION_MINIMUM &&
    now.getTime() - lastHeartbeatAt.getTime() > RELOAD_GAP_MS
  ) {
    return lastPosition;
  }

  return clampedCurrent;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max < min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
