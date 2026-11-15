import { describe, expect, it } from "vitest";
import { isValidBlogSlug, slugifyTitle } from "@/lib/blog/slug";

describe("slugifyTitle", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(slugifyTitle("  Learning React: Día 1!  ")).toBe("learning-react-dia-1");
  });

  it("avoids reserved route names", () => {
    expect(slugifyTitle("New")).toBe("new-post");
  });
});

describe("isValidBlogSlug", () => {
  it("accepts kebab-case and rejects everything else", () => {
    expect(isValidBlogSlug("my-first-post")).toBe(true);
    expect(isValidBlogSlug("My-Post")).toBe(false);
    expect(isValidBlogSlug("a--b")).toBe(false);
    expect(isValidBlogSlug("new")).toBe(false);
  });
});
