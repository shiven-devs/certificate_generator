import { describe, expect, it } from "vitest";
import { parseYoutubeUrl } from "@/lib/youtube/url";
import { ErrorCodes } from "@/lib/errors/app-error";
import { AppError } from "@/lib/errors/app-error";

describe("parseYoutubeUrl", () => {
  it("parses a watch URL as a video", () => {
    expect(
      parseYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toEqual({ sourceType: "video", youtubeId: "dQw4w9WgXcQ" });
  });

  it("parses youtu.be short links", () => {
    expect(parseYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      sourceType: "video",
      youtubeId: "dQw4w9WgXcQ",
    });
  });

  it("parses playlist share URLs with extra query params", () => {
    expect(
      parseYoutubeUrl(
        "https://youtube.com/playlist?list=PLu1N9RO5O7kSO6ghLD30oFX5Db1ASUvRT&si=pjjcal63pRBokr9q",
      ),
    ).toEqual({
      sourceType: "playlist",
      youtubeId: "PLu1N9RO5O7kSO6ghLD30oFX5Db1ASUvRT",
    });
  });

  it("parses playlist URLs", () => {
    expect(
      parseYoutubeUrl(
        "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toEqual({
      sourceType: "playlist",
      youtubeId: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
    });
  });

  it("treats watch URLs with list= as the playlist", () => {
    expect(
      parseYoutubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toEqual({
      sourceType: "playlist",
      youtubeId: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
    });
  });

  it("parses shorts URLs as videos", () => {
    expect(
      parseYoutubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toEqual({ sourceType: "video", youtubeId: "dQw4w9WgXcQ" });
  });

  it("rejects non-YouTube hosts", () => {
    try {
      parseYoutubeUrl("https://example.com/watch?v=dQw4w9WgXcQ");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCodes.INVALID_YOUTUBE_URL);
    }
  });
});
