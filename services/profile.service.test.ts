import { beforeEach, describe, expect, it, vi } from "vitest";

const listEnrollmentsForUser = vi.fn();
const findUserProfileByHandle = vi.fn();
const findUserProfileState = vi.fn();
const getActivityOverviewForProfile = vi.fn();

vi.mock("@/repositories/enrollment.repository", () => ({
  listEnrollmentsForUser,
  setEnrollmentProfileVisibility: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  findUserProfileByHandle,
  findUserProfileState,
  claimProfileHandle: vi.fn(),
  updateProfileSettings: vi.fn(),
}));

vi.mock("@/services/activity.service", () => ({
  getActivityOverviewForProfile,
}));

const { getMyProfile, getPublicProfile } = await import("@/services/profile.service");

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    name: "Shiven Kumar",
    email: "shiven@example.com",
    profileHandle: "shiven-kumar",
    profileShowHeatmap: true,
    profileHeadline: null,
    currentStreak: 4,
    longestStreak: 9,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function enrollment(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => "e1" },
    completedAt: null,
    profileHidden: false,
    itemProgress: [
      { youtubeVideoId: "a", watchedSeconds: 900, completed: true },
      { youtubeVideoId: "b", watchedSeconds: 100, completed: false },
    ],
    course: {
      _id: { toString: () => "c1" },
      title: "Data structures",
      thumbnailUrl: "https://img/1.jpg",
      sourceType: "playlist",
      youtubeId: "PL1234567890",
      items: [
        { youtubeVideoId: "a", title: "Arrays", durationSeconds: 1000, order: 0 },
        { youtubeVideoId: "b", title: "Lists", durationSeconds: 1000, order: 1 },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getActivityOverviewForProfile.mockResolvedValue({ months: [] });
});

describe("getPublicProfile", () => {
  it("returns null for an unknown handle", async () => {
    findUserProfileByHandle.mockResolvedValue(null);
    expect(await getPublicProfile("nobody")).toBeNull();
    expect(listEnrollmentsForUser).not.toHaveBeenCalled();
  });

  it("returns null for a malformed handle without hitting the database", async () => {
    expect(await getPublicProfile("x")).toBeNull();
    expect(findUserProfileByHandle).not.toHaveBeenCalled();
  });

  it("lists only courses with credited lectures", async () => {
    findUserProfileByHandle.mockResolvedValue(user());
    listEnrollmentsForUser.mockResolvedValue([
      enrollment(),
      enrollment({
        _id: { toString: () => "e2" },
        itemProgress: [{ youtubeVideoId: "a", watchedSeconds: 10, completed: false }],
      }),
    ]);

    const result = await getPublicProfile("shiven-kumar");
    expect(result?.courses.map((course) => course.enrollmentId)).toEqual(["e1"]);
    expect(result?.courses[0]!.completedLessonCount).toBe(1);
    expect(result?.courses[0]!.completed).toBe(false);
    expect(result?.courses[0]!.lessons.map((lesson) => lesson.title)).toEqual([
      "Arrays",
    ]);
    expect(result?.profile.completedLessonCount).toBe(1);
    expect(result?.profile.completedCourseCount).toBe(0);
  });

  it("omits courses the learner removed from the profile", async () => {
    findUserProfileByHandle.mockResolvedValue(user());
    listEnrollmentsForUser.mockResolvedValue([enrollment({ profileHidden: true })]);

    const result = await getPublicProfile("shiven-kumar");
    expect(result?.courses).toEqual([]);
    expect(result?.profile.completedLessonCount).toBe(0);
  });

  it("skips the heatmap when the learner hid it", async () => {
    findUserProfileByHandle.mockResolvedValue(user({ profileShowHeatmap: false }));
    listEnrollmentsForUser.mockResolvedValue([]);

    const result = await getPublicProfile("shiven-kumar");
    expect(result?.activity).toBeNull();
    expect(getActivityOverviewForProfile).not.toHaveBeenCalled();
  });

  it("counts a course as completed once every lecture is credited", async () => {
    findUserProfileByHandle.mockResolvedValue(user());
    listEnrollmentsForUser.mockResolvedValue([
      enrollment({
        itemProgress: [
          { youtubeVideoId: "a", watchedSeconds: 900, completed: true },
          { youtubeVideoId: "b", watchedSeconds: 800, completed: true },
        ],
      }),
    ]);

    const result = await getPublicProfile("shiven-kumar");
    expect(result?.courses[0]!.completed).toBe(true);
    expect(result?.profile.completedCourseCount).toBe(1);
  });

  it("never exposes the email address", async () => {
    findUserProfileByHandle.mockResolvedValue(user());
    listEnrollmentsForUser.mockResolvedValue([enrollment()]);

    const result = await getPublicProfile("shiven-kumar");
    expect(JSON.stringify(result)).not.toContain("shiven@example.com");
  });
});

describe("getMyProfile", () => {
  it("keeps hidden courses in the editor list but out of the summary", async () => {
    findUserProfileState.mockResolvedValue(user());
    listEnrollmentsForUser.mockResolvedValue([
      enrollment(),
      enrollment({ _id: { toString: () => "e2" }, profileHidden: true }),
    ]);

    const result = await getMyProfile("u1");
    expect(result.courses.map((course) => course.visible)).toEqual([true, false]);
    expect(result.profile.completedLessonCount).toBe(1);
  });
});
