import { describe, expect, it } from "vitest";
import { firstPlayableVideoId, isVideoUnlocked } from "@/lib/progress/unlock";

const items = [
  { youtubeVideoId: "aaaaaaaaaaa" },
  { youtubeVideoId: "bbbbbbbbbbb" },
  { youtubeVideoId: "ccccccccccc" },
];

describe("playlist access", () => {
  it("makes every course video playable regardless of completion order", () => {
    const progress = items.map((item) => ({
      youtubeVideoId: item.youtubeVideoId,
      completed: false,
    }));

    expect(isVideoUnlocked(items, progress, "aaaaaaaaaaa")).toBe(true);
    expect(isVideoUnlocked(items, progress, "bbbbbbbbbbb")).toBe(true);
    expect(isVideoUnlocked(items, progress, "ccccccccccc")).toBe(true);
    expect(firstPlayableVideoId(items, progress)).toBe("aaaaaaaaaaa");
  });

  it("resumes at the first incomplete lesson without locking later ones", () => {
    const progress = [
      { youtubeVideoId: "bbbbbbbbbbb", completed: false },
      { youtubeVideoId: "aaaaaaaaaaa", completed: true },
      { youtubeVideoId: "ccccccccccc", completed: false },
    ];

    expect(isVideoUnlocked(items, progress, "bbbbbbbbbbb")).toBe(true);
    expect(isVideoUnlocked(items, progress, "ccccccccccc")).toBe(true);
    expect(firstPlayableVideoId(items, progress)).toBe("bbbbbbbbbbb");
  });

  it("rejects a video that is not in the course", () => {
    expect(isVideoUnlocked(items, [], "zzzzzzzzzzz")).toBe(false);
  });
});
