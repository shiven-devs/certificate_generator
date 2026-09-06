import { describe, expect, it } from "vitest";
import {
  MAX_PLAYBACK_RATE,
  completionThreshold,
  decideProgressCredit,
  isCompletedByWatchTime,
} from "@/lib/progress/rules";

const now = new Date("2026-08-22T10:00:00.000Z");

describe("progress rules", () => {
  it("uses a 95 percent completion threshold with a small tail allowance", () => {
    expect(completionThreshold(100)).toBe(92);
    expect(completionThreshold(20)).toBe(12);
    expect(isCompletedByWatchTime(91, 100)).toBe(false);
    expect(isCompletedByWatchTime(92, 100)).toBe(true);
  });

  it("accepts the first sample without crediting time", () => {
    expect(
      decideProgressCredit({
        previousVideoTime: null,
        previousServerTime: null,
        currentVideoTime: 5,
        currentServerTime: now,
        reportedPlaybackRate: 1,
        existingWatchedSeconds: 0,
        durationSeconds: 100,
      }),
    ).toMatchObject({
      accepted: true,
      creditedSeconds: 0,
      reason: "first_sample",
    });
  });

  it("credits legitimate 1.5x playback", () => {
    const decision = decideProgressCredit({
      previousVideoTime: 10,
      previousServerTime: now,
      currentVideoTime: 25,
      currentServerTime: new Date(now.getTime() + 10_000),
      reportedPlaybackRate: MAX_PLAYBACK_RATE,
      existingWatchedSeconds: 10,
      durationSeconds: 100,
    });

    expect(decision).toMatchObject({
      accepted: true,
      creditedSeconds: 15,
      reason: "progress",
    });
  });

  it("rejects playback above the allowed rate", () => {
    expect(
      decideProgressCredit({
        previousVideoTime: 10,
        previousServerTime: now,
        currentVideoTime: 20,
        currentServerTime: new Date(now.getTime() + 10_000),
        reportedPlaybackRate: 1.75,
        existingWatchedSeconds: 10,
        durationSeconds: 100,
      }),
    ).toMatchObject({
      accepted: false,
      reason: "playback_rate_too_high",
    });
  });

  it("rejects forward seeks that exceed wall-clock credit", () => {
    expect(
      decideProgressCredit({
        previousVideoTime: 10,
        previousServerTime: now,
        currentVideoTime: 70,
        currentServerTime: new Date(now.getTime() + 10_000),
        reportedPlaybackRate: 1,
        existingWatchedSeconds: 10,
        durationSeconds: 100,
      }),
    ).toMatchObject({
      accepted: false,
      reason: "implausible_jump",
    });
  });

  it("does not treat a reported playbackRate of 1.5 as proof of wall-clock time", () => {
    expect(
      decideProgressCredit({
        previousVideoTime: 0,
        previousServerTime: now,
        currentVideoTime: 40,
        currentServerTime: new Date(now.getTime() + 10_000),
        reportedPlaybackRate: MAX_PLAYBACK_RATE,
        existingWatchedSeconds: 0,
        durationSeconds: 100,
      }),
    ).toMatchObject({
      accepted: false,
      reason: "implausible_jump",
    });
  });

  it("rejects backward or duplicate samples", () => {
    expect(
      decideProgressCredit({
        previousVideoTime: 20,
        previousServerTime: now,
        currentVideoTime: 15,
        currentServerTime: new Date(now.getTime() + 10_000),
        reportedPlaybackRate: 1,
        existingWatchedSeconds: 20,
        durationSeconds: 100,
      }),
    ).toMatchObject({
      accepted: false,
      reason: "non_positive_delta",
    });
  });
});
