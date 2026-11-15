import { describe, expect, it } from "vitest";
import { profileShareDescription } from "@/lib/profile/share-text";

const base = {
  name: "Shiven Kumar",
  completedLessonCount: 7,
  completedCourseCount: 4,
  longestStreak: 12,
};

describe("profileShareDescription", () => {
  it("states courses, lectures, and the best streak", () => {
    expect(profileShareDescription(base)).toBe(
      "Shiven Kumar has completed 4 courses and 7 lectures on CertiTube, with a 12-day best streak. See their learning journey.",
    );
  });

  it("singularizes a single lecture and course", () => {
    expect(
      profileShareDescription({
        ...base,
        completedLessonCount: 1,
        completedCourseCount: 1,
      }),
    ).toContain("1 course and 1 lecture on CertiTube");
  });

  it("drops the streak clause when there is no streak yet", () => {
    const description = profileShareDescription({
      ...base,
      completedLessonCount: 0,
      completedCourseCount: 0,
      longestStreak: 0,
    });
    expect(description).toBe(
      "Shiven Kumar has completed 0 courses and 0 lectures on CertiTube. See their learning journey.",
    );
  });
});
