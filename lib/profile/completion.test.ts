import { describe, expect, it } from "vitest";
import {
  completedLessons,
  completedWatchSeconds,
  isCourseCompleted,
  isLessonCompleted,
} from "@/lib/profile/completion";

const lessons = [
  { youtubeVideoId: "a", title: "Lesson A", durationSeconds: 1000, order: 0 },
  { youtubeVideoId: "b", title: "Lesson B", durationSeconds: 1000, order: 1 },
];

describe("isLessonCompleted", () => {
  it("is false below 75% of the runtime", () => {
    expect(isLessonCompleted(740, 1000)).toBe(false);
  });

  it("is true at or above 75% of the runtime", () => {
    expect(isLessonCompleted(750, 1000)).toBe(true);
    expect(isLessonCompleted(1000, 1000)).toBe(true);
  });
});

describe("completedLessons", () => {
  it("lists only credited lessons, in course order", () => {
    const result = completedLessons(
      [...lessons].reverse(),
      [
        { youtubeVideoId: "a", watchedSeconds: 800 },
        { youtubeVideoId: "b", watchedSeconds: 100 },
      ],
    );
    expect(result.map((lesson) => lesson.youtubeVideoId)).toEqual(["a"]);
    expect(result[0]!.creditedPercent).toBe(80);
  });

  it("ignores progress rows for lessons that left the course", () => {
    const result = completedLessons(lessons, [
      { youtubeVideoId: "gone", watchedSeconds: 5000 },
    ]);
    expect(result).toEqual([]);
  });
});

describe("completedWatchSeconds", () => {
  it("counts credited seconds of completed lessons only", () => {
    expect(
      completedWatchSeconds(lessons, [
        { youtubeVideoId: "a", watchedSeconds: 900 },
        { youtubeVideoId: "b", watchedSeconds: 200 },
      ]),
    ).toBe(900);
  });

  it("never counts more than the lesson runtime", () => {
    expect(
      completedWatchSeconds(lessons, [
        { youtubeVideoId: "a", watchedSeconds: 4000 },
        { youtubeVideoId: "b", watchedSeconds: 4000 },
      ]),
    ).toBe(2000);
  });
});

describe("isCourseCompleted", () => {
  it("needs every lesson credited", () => {
    expect(
      isCourseCompleted(lessons, [
        { youtubeVideoId: "a", watchedSeconds: 900 },
        { youtubeVideoId: "b", watchedSeconds: 200 },
      ]),
    ).toBe(false);
    expect(
      isCourseCompleted(lessons, [
        { youtubeVideoId: "a", watchedSeconds: 900 },
        { youtubeVideoId: "b", watchedSeconds: 900 },
      ]),
    ).toBe(true);
  });

  it("is false for a course with no lessons", () => {
    expect(isCourseCompleted([], [])).toBe(false);
  });
});
