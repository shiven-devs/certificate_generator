import { describe, expect, it } from "vitest";
import { firstPlayableVideoId, isVideoUnlocked } from "@/lib/progress/unlock";

const items = [
  { youtubeVideoId: "aaaaaaaaaaa" },
  { youtubeVideoId: "bbbbbbbbbbb" },
  { youtubeVideoId: "ccccccccccc" },
];

describe("sequential unlock", () => {
  it("unlocks only the first lesson until it is complete", () => {
    const progress = items.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      completed: false,
    }));

    expect(isVideoUnlocked(items, progress, "aaaaaaaaaaa")).toBe(true);
    expect(isVideoUnlocked(items, progress, "bbbbbbbbbbb")).toBe(false);
    expect(isVideoUnlocked(items, progress, "ccccccccccc")).toBe(false);
    expect(firstPlayableVideoId(items, progress)).toBe("aaaaaaaaaaa");
  });

  it("unlocks the next lesson from previous completion, not array index", () => {
    const progress = [
      { youtubeVideoId: "bbbbbbbbbbb", completed: false },
      { youtubeVideoId: "aaaaaaaaaaa", completed: true },
      { youtubeVideoId: "ccccccccccc", completed: false },
    ];

    expect(isVideoUnlocked(items, progress, "bbbbbbbbbbb")).toBe(true);
    expect(isVideoUnlocked(items, progress, "ccccccccccc")).toBe(false);
    expect(firstPlayableVideoId(items, progress)).toBe("bbbbbbbbbbb");
  });

  it("rejects a video that is not in the course", () => {
    expect(isVideoUnlocked(items, [], "zzzzzzzzzzz")).toBe(false);
  });
});
