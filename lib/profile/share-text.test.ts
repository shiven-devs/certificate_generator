import { describe, expect, it } from "vitest";
import { profileShareDescription } from "@/lib/profile/share-text";

const base = {
  name: "Shiven Kumar",
  headline: null,
  completedLessonCount: 7,
  completedCourseCount: 4,
  currentStreak: 1,
};

describe("profileShareDescription", () => {
  it("clears the 100 character minimum without a headline", () => {
    const description = profileShareDescription(base);
    expect(description.length).toBeGreaterThanOrEqual(100);
    expect(description).toContain("7 lectures across 4 courses");
    expect(description).toContain("1 day study streak");
  });

  it("keeps the headline first and still includes the stats", () => {
    const description = profileShareDescription({
      ...base,
      headline: "  MERN stack developer  ",
    });
    expect(description.startsWith("MERN stack developer — ")).toBe(true);
    expect(description).toContain("Shiven Kumar has completed");
    expect(description.length).toBeGreaterThanOrEqual(100);
  });

  it("singularizes a single lecture, course, and day", () => {
    expect(
      profileShareDescription({
        ...base,
        completedLessonCount: 1,
        completedCourseCount: 1,
        currentStreak: 1,
      }),
    ).toContain("1 lecture across 1 course");
  });

  it("stays sensible for an empty profile", () => {
    const description = profileShareDescription({
      ...base,
      completedLessonCount: 0,
      completedCourseCount: 0,
      currentStreak: 0,
    });
    expect(description).toContain("0 lectures across 0 courses");
    expect(description.length).toBeGreaterThanOrEqual(100);
  });
});
