import { describe, expect, it } from "vitest";
import { isPreviewEnrollable, playablePreviewItems } from "@/lib/youtube/playable";
import type { CoursePreviewItem } from "@/lib/youtube/types";

function item(
  partial: Partial<CoursePreviewItem> & Pick<CoursePreviewItem, "youtubeVideoId">,
): CoursePreviewItem {
  return {
    title: "Video",
    description: "",
    durationSeconds: 10,
    order: 0,
    playable: true,
    issue: null,
    ...partial,
  };
}

describe("playable playlist items", () => {
  it("keeps only embeddable videos and reindexes order", () => {
    const items = [
      item({ youtubeVideoId: "aaaaaaaaaaa", order: 0 }),
      item({
        youtubeVideoId: "bbbbbbbbbbb",
        order: 1,
        playable: false,
        issue: "unavailable",
        durationSeconds: 0,
      }),
      item({ youtubeVideoId: "ccccccccccc", order: 2 }),
    ];

    expect(playablePreviewItems(items)).toEqual([
      expect.objectContaining({ youtubeVideoId: "aaaaaaaaaaa", order: 0 }),
      expect.objectContaining({ youtubeVideoId: "ccccccccccc", order: 1 }),
    ]);
    expect(isPreviewEnrollable(items)).toBe(true);
  });

  it("rejects a playlist where nothing can be played", () => {
    expect(
      isPreviewEnrollable([
        item({
          youtubeVideoId: "aaaaaaaaaaa",
          playable: false,
          issue: "not_embeddable",
        }),
      ]),
    ).toBe(false);
  });
});
