import { describe, expect, it } from "vitest";
import { buildNotionNoteMarkdown, singleLineTitle } from "@/lib/notion/markdown";

describe("buildNotionNoteMarkdown", () => {
  it("uses the lesson title as the page heading and includes the note body", () => {
    expect(
      buildNotionNoteMarkdown({
        courseTitle: "React Basics",
        lessonTitle: "Hooks",
        body: "useState is for local state.",
      }),
    ).toBe(
      [
        "# Hooks",
        "Course: React Basics",
        "",
        "useState is for local state.",
        "",
        "---",
        "Synced from Certitube",
      ].join("\n"),
    );
  });

  it("keeps an empty note publishable", () => {
    const markdown = buildNotionNoteMarkdown({
      courseTitle: "Course",
      lessonTitle: "Lesson",
      body: "   ",
    });
    expect(markdown).toContain("_No notes yet._");
  });
});

describe("singleLineTitle", () => {
  it("strips line breaks so markdown headings stay on one line", () => {
    expect(singleLineTitle("Week 1\nIntro")).toBe("Week 1 Intro");
  });
});
