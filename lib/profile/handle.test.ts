import { describe, expect, it } from "vitest";
import {
  isValidProfileHandle,
  normalizeProfileHandle,
  profileHandleCandidates,
  slugifyHandle,
} from "@/lib/profile/handle";

describe("isValidProfileHandle", () => {
  it("accepts lowercase handles with inner hyphens", () => {
    expect(isValidProfileHandle("shiven-kumar")).toBe(true);
  });

  it("rejects handles that are too short, edge-hyphenated, or uppercase", () => {
    expect(isValidProfileHandle("ab")).toBe(false);
    expect(isValidProfileHandle("-shiven")).toBe(false);
    expect(isValidProfileHandle("shiven-")).toBe(false);
    expect(isValidProfileHandle("Shiven")).toBe(false);
  });

  it("rejects reserved route names", () => {
    expect(isValidProfileHandle("dashboard")).toBe(false);
    expect(isValidProfileHandle("api")).toBe(false);
  });
});

describe("normalizeProfileHandle", () => {
  it("trims and lowercases a usable handle", () => {
    expect(normalizeProfileHandle("  Shiven-Kumar ")).toBe("shiven-kumar");
  });

  it("returns null for an unusable handle", () => {
    expect(normalizeProfileHandle("no spaces allowed")).toBeNull();
  });
});

describe("slugifyHandle", () => {
  it("slugifies a display name", () => {
    expect(slugifyHandle("Shiven  Kumar!")).toBe("shiven-kumar");
  });

  it("uses only the local part of an email", () => {
    expect(slugifyHandle("shiven.1si24cs164@gmail.com")).toBe("shiven-1si24cs164");
  });
});

describe("profileHandleCandidates", () => {
  it("offers the plain name first on the first attempt", () => {
    const candidates = profileHandleCandidates({
      name: "Shiven Kumar",
      email: "shiven@example.com",
      attempt: 0,
    });
    expect(candidates[0]).toBe("shiven-kumar");
    expect(candidates.every((candidate) => isValidProfileHandle(candidate))).toBe(true);
  });

  it("only offers suffixed handles on later attempts", () => {
    const candidates = profileHandleCandidates({
      name: "Shiven Kumar",
      email: "shiven@example.com",
      attempt: 2,
    });
    expect(candidates).not.toContain("shiven-kumar");
    expect(candidates.every((candidate) => isValidProfileHandle(candidate))).toBe(true);
  });

  it("falls back to a valid handle when the name has no usable characters", () => {
    const candidates = profileHandleCandidates({
      name: "!!!",
      email: "!!@example.com",
      attempt: 0,
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => isValidProfileHandle(candidate))).toBe(true);
  });
});
