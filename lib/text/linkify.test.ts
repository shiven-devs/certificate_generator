import { describe, expect, it } from "vitest";
import { linkifyText } from "@/lib/text/linkify";

describe("linkifyText", () => {
  it("returns empty parts for empty input", () => {
    expect(linkifyText("")).toEqual([]);
  });

  it("leaves plain text unchanged", () => {
    expect(linkifyText("Watch the next lecture.")).toEqual([
      { type: "text", value: "Watch the next lecture." },
    ]);
  });

  it("turns http(s) URLs into links and keeps surrounding text", () => {
    expect(
      linkifyText("Notes: https://example.com/guide and more"),
    ).toEqual([
      { type: "text", value: "Notes: " },
      {
        type: "link",
        value: "https://example.com/guide",
        href: "https://example.com/guide",
      },
      { type: "text", value: " and more" },
    ]);
  });

  it("prefixes www URLs with https", () => {
    expect(linkifyText("www.example.com/path")).toEqual([
      {
        type: "link",
        value: "www.example.com/path",
        href: "https://www.example.com/path",
      },
    ]);
  });

  it("strips trailing punctuation from the href", () => {
    expect(linkifyText("See https://example.com.")).toEqual([
      { type: "text", value: "See " },
      {
        type: "link",
        value: "https://example.com",
        href: "https://example.com/",
      },
      { type: "text", value: "." },
    ]);
  });

  it("does not treat javascript URLs as links", () => {
    expect(linkifyText("javascript:alert(1)")).toEqual([
      { type: "text", value: "javascript:alert(1)" },
    ]);
  });
});
