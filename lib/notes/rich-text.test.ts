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

  it("drops the backslashes added when the note was saved", () => {
    const html = markdownToEditorHtml(
      "import \\{node\\_config\\} from './config.json'",
    );
    expect(html).toBe("<div>import {node_config} from './config.json'</div>");
  });

  it("keeps escaped markers as literal text instead of formatting", () => {
    const html = markdownToEditorHtml("\\*stars\\* and \\`ticks\\`");
    expect(html).toBe("<div>*stars* and `ticks`</div>");
  });

  it("still formats unescaped markers around escaped characters", () => {
    const html = markdownToEditorHtml("**bold \\_name\\_**");
    expect(html).toBe("<div><strong>bold _name_</strong></div>");
  });

  it("does not let an escaped tag through as markup", () => {
    const html = markdownToEditorHtml("\\<script\\>alert(1)\\</script\\>");
    expect(html).toBe("<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>");
  });

  it("unwraps one level, so a typed backslash survives the round trip", () => {
    expect(markdownToEditorHtml('"\\\\n"')).toBe("<div>&quot;\\n&quot;</div>");
  });
});
