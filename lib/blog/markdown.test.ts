import { describe, expect, it } from "vitest";
import { readingMinutes, renderBlogMarkdown, safeHref } from "@/lib/blog/markdown";

describe("renderBlogMarkdown", () => {
  it("renders headings, emphasis, lists, and code", () => {
    const html = renderBlogMarkdown("## Title\n\n**bold** and *it*\n\n- a\n- b\n\n`x < y`");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<code>x &lt; y</code>");
  });

  it("escapes raw HTML blocks and inline tags", () => {
    const html = renderBlogMarkdown(
      '<script>alert(1)</script>\n\nhi <img src=x onerror="alert(1)">',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links but keeps their text", () => {
    const html = renderBlogMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click");
  });

  it("opens external links in a new tab safely", () => {
    const html = renderBlogMarkdown("[site](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps https images and drops data: images", () => {
    expect(renderBlogMarkdown("![a](https://img.test/a.png)")).toContain(
      '<img src="https://img.test/a.png" alt="a"',
    );
    expect(renderBlogMarkdown("![a](data:text/html;base64,xx)")).not.toContain("<img");
  });
});

describe("safeHref", () => {
  it("accepts relative, anchor, http(s), and mailto links only", () => {
    expect(safeHref("/how-it-works")).toBe("/how-it-works");
    expect(safeHref("#faq")).toBe("#faq");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeHref("//evil.test")).toBeNull();
    expect(safeHref("vbscript:x")).toBeNull();
  });
});

describe("readingMinutes", () => {
  it("never reports less than one minute", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes("word ".repeat(660))).toBe(3);
  });
});
