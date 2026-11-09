import { describe, expect, it } from "vitest";
import { derivePageTitle, newNotePageId } from "@/lib/notes/pages";

describe("derivePageTitle", () => {
  it("falls back to the page number while a page is empty", () => {
    expect(derivePageTitle("", 0)).toBe("Page 1");
    expect(derivePageTitle("   \n\n", 2)).toBe("Page 3");
  });

  it("uses the first line of content", () => {
    expect(derivePageTitle("Gossip rounds\nEvery node picks a peer.", 1)).toBe(
      "Gossip rounds",
    );
  });

  it("strips heading, list and emphasis markers", () => {
    expect(derivePageTitle("## **Seed nodes**", 0)).toBe("Seed nodes");
    expect(derivePageTitle("- config.json setup", 0)).toBe("config.json setup");
    expect(derivePageTitle("1. First pass", 0)).toBe("First pass");
    expect(derivePageTitle('<span underline="true">Anti-entropy</span>', 0)).toBe(
      "Anti-entropy",
    );
  });

  it("skips blank leading lines", () => {
    expect(derivePageTitle("\n\n  \nReal title", 0)).toBe("Real title");
  });

  it("truncates long titles", () => {
    const title = derivePageTitle("x".repeat(200), 0);
    expect(title).toHaveLength(60);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("newNotePageId", () => {
  it("returns distinct uuids", () => {
    const first = newNotePageId();
    const second = newNotePageId();
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(first).not.toBe(second);
  });
});
