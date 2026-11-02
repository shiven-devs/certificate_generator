import { describe, expect, it } from "vitest";
import type { CoursePreview, CoursePreviewItem } from "@/lib/youtube/types";
import {
  classifyLearningContent,
  isLikelyEntertainmentTitle,
  MIN_LEARNING_SHARE,
  withLearningEnrollment,
} from "@/lib/youtube/learning-eligibility";

function item(
  partial: Partial<CoursePreviewItem> & Pick<CoursePreviewItem, "youtubeVideoId">,
): CoursePreviewItem {
  return {
    title: "Video",
    description: "",
    durationSeconds: 60,
    order: 0,
    playable: true,
    issue: null,
    ...partial,
  };
}

function preview(
  partial: Partial<CoursePreview> & Pick<CoursePreview, "items">,
): CoursePreview {
  return {
    youtubeId: "aaaaaaaaaaa",
    sourceType: "video",
    title: "Course",
    thumbnailUrl: "",
    totalDurationSeconds: 60,
    enrollable: true,
    learningEligible: true,
    ...partial,
  };
}

describe("classifyLearningContent", () => {
  it("allows Education category lectures", () => {
    expect(
      classifyLearningContent({
        title: "CS50 2024 - Lecture 0",
        categoryId: "27",
      }),
    ).toBe(true);
  });

  it("allows Science & Technology and Howto categories", () => {
    expect(
      classifyLearningContent({
        title: "React in 100 seconds",
        categoryId: "28",
      }),
    ).toBe(true);
    expect(
      classifyLearningContent({
        title: "How to set up a home lab",
        categoryId: "26",
      }),
    ).toBe(true);
    expect(
      classifyLearningContent({
        title: "How to draw anime characters",
        categoryId: "26",
      }),
    ).toBe(true);
  });

  it("rejects Music and Entertainment categories", () => {
    expect(
      classifyLearningContent({
        title: "Never Gonna Give You Up",
        categoryId: "10",
      }),
    ).toBe(false);
    expect(
      classifyLearningContent({
        title: "Stranger Things | Official Trailer",
        categoryId: "24",
      }),
    ).toBe(false);
  });

  it("rejects educational-sounding titles in Music category", () => {
    expect(
      classifyLearningContent({
        title: "Python Tutorial Lofi Mix",
        categoryId: "10",
      }),
    ).toBe(false);
  });

  it("allows ambiguous categories when title is clearly a tutorial", () => {
    expect(
      classifyLearningContent({
        title: "Full Python tutorial for beginners",
        description: "Learn programming step by step",
        categoryId: "22",
      }),
    ).toBe(true);
  });

  it("allows project-based teaching that never says tutorial", () => {
    expect(
      classifyLearningContent({
        title: "Build Your Own Redis Server in C++ | Part 10 - Testing Our Server",
      }),
    ).toBe(true);
  });

  it("rejects ambiguous categories with no learning signal", () => {
    expect(
      classifyLearningContent({
        title: "A day in my life",
        description: "vlog from last weekend",
        categoryId: "22",
      }),
    ).toBe(false);
  });

  it("rejects entertainment titles even in Education category", () => {
    expect(
      classifyLearningContent({
        title: "Official Music Video",
        categoryId: "27",
      }),
    ).toBe(false);
  });

  it("fails closed when category is missing and text is unclear", () => {
    expect(
      classifyLearningContent({
        title: "Sunday morning",
        description: "",
      }),
    ).toBe(false);
  });
});

describe("isLikelyEntertainmentTitle", () => {
  it("detects web-series and movie phrasing", () => {
    expect(isLikelyEntertainmentTitle("Show Name Season 1 Episode 4")).toBe(
      true,
    );
    expect(isLikelyEntertainmentTitle("Blockbuster Full Movie")).toBe(true);
  });

  it("does not flag ordinary lecture titles", () => {
    expect(isLikelyEntertainmentTitle("Introduction to Algorithms")).toBe(false);
  });
});

describe("withLearningEnrollment", () => {
  it("keeps a single learning video enrollable", () => {
    const result = withLearningEnrollment(
      preview({
        items: [item({ youtubeVideoId: "aaaaaaaaaaa" })],
      }),
    );
    expect(result.learningEligible).toBe(true);
    expect(result.enrollable).toBe(true);
  });

  it("blocks a playlist whose title looks like a series", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Web Series Season 1 Full Episodes",
        items: [
          item({ youtubeVideoId: "aaaaaaaaaaa" }),
          item({ youtubeVideoId: "bbbbbbbbbbb", order: 1 }),
        ],
      }),
    );
    expect(result.learningEligible).toBe(false);
    expect(result.enrollable).toBe(false);
  });

  it(`requires at least ${MIN_LEARNING_SHARE * 100}% of watchable items to be learning content`, () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Mixed dump",
        items: [
          item({ youtubeVideoId: "aaaaaaaaaaa" }),
          item({
            youtubeVideoId: "bbbbbbbbbbb",
            order: 1,
            playable: false,
            issue: "not_learning",
          }),
          item({
            youtubeVideoId: "ccccccccccc",
            order: 2,
            playable: false,
            issue: "not_learning",
          }),
        ],
      }),
    );
    expect(result.learningEligible).toBe(false);
    expect(result.enrollable).toBe(false);
  });

  it("does not treat unplayable-only playlists as entertainment", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Private lecture set",
        items: [
          item({
            youtubeVideoId: "aaaaaaaaaaa",
            playable: false,
            issue: "unavailable",
          }),
        ],
      }),
    );
    expect(result.learningEligible).toBe(true);
    expect(result.enrollable).toBe(false);
  });

  it("allows a playlist when most watchable items are learning videos", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "JavaScript course",
        items: [
          item({ youtubeVideoId: "aaaaaaaaaaa" }),
          item({ youtubeVideoId: "bbbbbbbbbbb", order: 1 }),
          item({ youtubeVideoId: "ccccccccccc", order: 2 }),
          item({ youtubeVideoId: "ddddddddddd", order: 3 }),
          item({
            youtubeVideoId: "eeeeeeeeeee",
            order: 4,
            playable: false,
            issue: "not_learning",
          }),
        ],
      }),
    );
    expect(result.learningEligible).toBe(true);
    expect(result.enrollable).toBe(true);
  });

  it("carries the quieter videos of a playlist that reads as a course", () => {
    const items = Array.from({ length: 15 }, (_, index) =>
      item({
        youtubeVideoId: `video${index}`.padEnd(11, "x"),
        order: index,
        title: `Build Your Own Redis Server in C++ | Part ${index + 1}`,
        ...(index % 3 === 0
          ? { playable: false, issue: "not_learning" as const }
          : {}),
      }),
    );

    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Build Your Own Redis Server in C++",
        items,
      }),
    );

    expect(result.learningEligible).toBe(true);
    expect(result.enrollable).toBe(true);
    expect(result.items.every((row) => row.playable)).toBe(true);
    expect(result.totalDurationSeconds).toBe(15 * 60);
  });

  it("still blocks a course-titled playlist that is mostly entertainment", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Python course",
        items: [
          item({ youtubeVideoId: "aaaaaaaaaaa" }),
          ...["bbbbbbbbbbb", "ccccccccccc", "ddddddddddd", "eeeeeeeeeee"].map(
            (youtubeVideoId, index) =>
              item({
                youtubeVideoId,
                order: index + 1,
                playable: false,
                issue: "not_learning",
              }),
          ),
        ],
      }),
    );

    expect(result.learningEligible).toBe(false);
    expect(result.enrollable).toBe(false);
  });

  it("keeps the entertainment veto ahead of a course-sounding title", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Python Tutorial Full Movie",
        items: [item({ youtubeVideoId: "aaaaaaaaaaa" })],
      }),
    );

    expect(result.learningEligible).toBe(false);
    expect(result.enrollable).toBe(false);
  });

  it("counts only playable videos in the total duration", () => {
    const result = withLearningEnrollment(
      preview({
        sourceType: "playlist",
        title: "Algorithms lecture series",
        items: [
          item({ youtubeVideoId: "aaaaaaaaaaa" }),
          item({
            youtubeVideoId: "bbbbbbbbbbb",
            order: 1,
            durationSeconds: 0,
            playable: false,
            issue: "unavailable",
          }),
        ],
      }),
    );

    expect(result.totalDurationSeconds).toBe(60);
  });
});
