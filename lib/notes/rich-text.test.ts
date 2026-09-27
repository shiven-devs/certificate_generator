import { describe, expect, it } from "vitest";
import {
  applyHeadingMarkdown,
  markdownToEditorHtml,
  wrapInlineMarkdown,
} from "@/lib/notes/rich-text";

describe("wrapInlineMarkdown", () => {
  it("wraps the selection in bold markers", () => {
    expect(wrapInlineMarkdown("hello world", 0, 5, "bold")).toEqual({
      next: "**hello** world",
      cursorStart: 0,
      cursorEnd: 9,
    });
  });

  it("wraps italic and underline", () => {
    expect(wrapInlineMarkdown("note", 0, 4, "italic").next).toBe("*note*");
    expect(wrapInlineMarkdown("note", 0, 4, "underline").next).toBe(
      '<span underline="true">note</span>',
    );
  });
});

describe("applyHeadingMarkdown", () => {
  it("prefixes the current line as a Notion heading", () => {
    expect(applyHeadingMarkdown("Intro\nDetails", 0, 5, 2)).toEqual({
      next: "## Intro\nDetails",
      cursorStart: 3,
      cursorEnd: 8,
    });
  });

  it("replaces an existing heading level", () => {
    expect(applyHeadingMarkdown("### Old", 0, 7, 1).next).toBe("# Old");
  });
});

describe("markdownToEditorHtml", () => {
  it("renders headings and inline styles", () => {
    const html = markdownToEditorHtml(
      "## Title\n**bold** and *italic* and <span underline=\"true\">under</span>",
    );
    expect(html).toContain("<h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<u>under</u>");
  });

  it("returns empty string for empty notes", () => {
    expect(markdownToEditorHtml("")).toBe("");
  });
});
