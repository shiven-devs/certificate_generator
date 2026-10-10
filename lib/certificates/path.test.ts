import { describe, expect, it } from "vitest";
import {
  certificateVerifyPath,
  certificateVerifyUrl,
  youtubeThumbnailUrl,
} from "@/lib/certificates/path";

describe("certificate verify paths", () => {
  it("builds a public verify path from the token", () => {
    expect(certificateVerifyPath("ab".repeat(32))).toBe(`/verify/${"ab".repeat(32)}`);
  });

  it("joins origin and path without a duplicate slash", () => {
    expect(certificateVerifyUrl("https://certitube.example/", "aa".repeat(32))).toBe(
      `https://certitube.example/verify/${"aa".repeat(32)}`,
    );
  });

  it("uses the YouTube thumbnail host already allowed by next/image", () => {
    expect(youtubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});
