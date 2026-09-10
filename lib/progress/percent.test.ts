import { describe, expect, it } from "vitest";
import { courseCreditedPercent, creditedPercent } from "@/lib/progress/percent";

describe("credited percent display", () => {
  it("matches the player formula for a single lecture", () => {
    expect(creditedPercent(30, 600)).toBe(5);
    expect(creditedPercent(0, 100)).toBe(0);
    expect(creditedPercent(100, 100)).toBe(100);
  });

  it("aggregates credited watch time across a course without using completion flags", () => {
    expect(
      courseCreditedPercent(
        [
          { youtubeVideoId: "aaaaaaaaaaa", durationSeconds: 100 },
          { youtubeVideoId: "bbbbbbbbbbb", durationSeconds: 100 },
        ],
        [
          { youtubeVideoId: "aaaaaaaaaaa", watchedSeconds: 10 },
          { youtubeVideoId: "bbbbbbbbbbb", watchedSeconds: 0 },
        ],
      ),
    ).toBe(5);
  });
});
