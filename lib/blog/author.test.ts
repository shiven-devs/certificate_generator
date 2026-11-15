import { describe, expect, it } from "vitest";
import { blogAuthorEmails, canWriteBlog } from "@/lib/blog/author";

const allowed = blogAuthorEmails(" Author@Example.com , second@example.com ");

describe("canWriteBlog", () => {
  it("allows a listed email with a Google identity, ignoring case", () => {
    expect(
      canWriteBlog({ email: "author@example.com", hasGoogleIdentity: true }, allowed),
    ).toBe(true);
  });

  it("refuses a listed email that was never verified through Google", () => {
    expect(
      canWriteBlog({ email: "author@example.com", hasGoogleIdentity: false }, allowed),
    ).toBe(false);
  });

  it("refuses everyone else", () => {
    expect(
      canWriteBlog({ email: "reader@example.com", hasGoogleIdentity: true }, allowed),
    ).toBe(false);
  });

  it("refuses everyone when no author is configured", () => {
    expect(
      canWriteBlog(
        { email: "author@example.com", hasGoogleIdentity: true },
        blogAuthorEmails(""),
      ),
    ).toBe(false);
  });
});
