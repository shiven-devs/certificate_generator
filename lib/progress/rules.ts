export const MAX_PLAYBACK_RATE = 1.5;
export const HEARTBEAT_JITTER_SECONDS = 2;
export const COMPLETION_RATIO = 0.75;
export const COMPLETION_TAIL_SECONDS = 8;

export type ProgressRejectReason =
  | "non_positive_delta"
  | "playback_rate_too_high"
  | "implausible_jump"
  | "invalid_duration"
  | "stale_heartbeat";

export type ProgressDecision =
  | {
      accepted: true;
      creditedSeconds: number;
      completed: boolean;
      reason: "first_sample" | "progress";
    }
  | {
      accepted: false;
      creditedSeconds: 0;
      completed: boolean;
      reason: ProgressRejectReason;
    };

export function completionThreshold(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(
    1,
    Math.min(
      durationSeconds,
      Math.floor(
        Math.min(
          durationSeconds * COMPLETION_RATIO,
          durationSeconds - COMPLETION_TAIL_SECONDS,
        ),
      ),
    ),
  );
}

export function isCompletedByWatchTime(
  watchedSeconds: number,
  durationSeconds: number,
): boolean {
  return watchedSeconds >= completionThreshold(durationSeconds);
}

export function decideProgressCredit(input: {
  previousVideoTime: number | null;
  previousServerTime: Date | null;
  currentVideoTime: number;
  currentServerTime: Date;
  reportedPlaybackRate: number;
  existingWatchedSeconds: number;
  durationSeconds: number;
}): ProgressDecision {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    return reject("invalid_duration", input.existingWatchedSeconds, input.durationSeconds);
  }

  if (input.reportedPlaybackRate > MAX_PLAYBACK_RATE) {
    return reject(
      "playback_rate_too_high",
      input.existingWatchedSeconds,
      input.durationSeconds,
    );
  }

  const currentVideoTime = clamp(input.currentVideoTime, 0, input.durationSeconds);
  if (input.previousVideoTime === null || input.previousServerTime === null) {
    return {
      accepted: true,
      creditedSeconds: 0,
      completed: isCompletedByWatchTime(
        input.existingWatchedSeconds,
        input.durationSeconds,
      ),
      reason: "first_sample",
    };
  }

  const previousVideoTime = clamp(input.previousVideoTime, 0, input.durationSeconds);
  const videoDelta = currentVideoTime - previousVideoTime;
  if (videoDelta <= 0) {
    return reject(
      "non_positive_delta",
      input.existingWatchedSeconds,
      input.durationSeconds,
    );
  }

  const wallDelta =
    (input.currentServerTime.getTime() - input.previousServerTime.getTime()) / 1000;
  if (wallDelta <= 0) {
    return reject(
      "non_positive_delta",
      input.existingWatchedSeconds,
      input.durationSeconds,
    );
  }

  const maxCredit = wallDelta * MAX_PLAYBACK_RATE + HEARTBEAT_JITTER_SECONDS;
  if (videoDelta > maxCredit) {
    return reject(
      "implausible_jump",
      input.existingWatchedSeconds,
      input.durationSeconds,
    );
  }

  const creditedSeconds = Math.min(
    videoDelta,
    Math.max(0, input.durationSeconds - input.existingWatchedSeconds),
  );
  const nextWatchedSeconds = input.existingWatchedSeconds + creditedSeconds;

  return {
    accepted: true,
    creditedSeconds,
    completed: isCompletedByWatchTime(nextWatchedSeconds, input.durationSeconds),
    reason: "progress",
  };
}

export function rejectProgress(
  reason: ProgressRejectReason,
  watchedSeconds: number,
  durationSeconds: number,
): ProgressDecision {
  return reject(reason, watchedSeconds, durationSeconds);
}

function reject(
  reason: ProgressRejectReason,
  watchedSeconds: number,
  durationSeconds: number,
): ProgressDecision {
  return {
    accepted: false,
    creditedSeconds: 0,
    completed: isCompletedByWatchTime(watchedSeconds, durationSeconds),
    reason,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
