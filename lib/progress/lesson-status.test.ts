import { describe, expect, it } from "vitest";
import { lessonWatchStatus } from "@/lib/progress/lesson-status";

describe("lessonWatchStatus", () => {
  it("marks server-completed videos as completed even when selected", () => {
    expect(
      lessonWatchStatus({
        completed: true,
        watchedSeconds: 90,
        lastPositionSeconds: 90,
        selected: true,
      }),
    ).toBe("completed");
  });

  it("marks the selected unfinished video as in progress", () => {
    expect(
      lessonWatchStatus({
        completed: false,
        watchedSeconds: 0,
        lastPositionSeconds: 0,
        selected: true,
      }),
    ).toBe("in-progress");
  });

  it("marks started but unfinished videos as in progress", () => {
    expect(
      lessonWatchStatus({
        completed: false,
        watchedSeconds: 12,
        lastPositionSeconds: 15,
        selected: false,
      }),
    ).toBe("in-progress");
  });

  it("marks untouched videos as not visited", () => {
    expect(
      lessonWatchStatus({
        completed: false,
        watchedSeconds: 0,
        lastPositionSeconds: 0,
        selected: false,
      }),
    ).toBe("not-visited");
  });
});
