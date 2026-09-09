import { describe, expect, it } from "vitest";
import { preserveResumePosition, resumePositionSeconds } from "@/lib/progress/resume";

describe("resumePositionSeconds", () => {
  it("returns the last playback position for a mid-video pause", () => {
    expect(resumePositionSeconds(1800, 3600)).toBe(1800);
  });

  it("starts from the beginning when there is no stored position", () => {
    expect(resumePositionSeconds(null, 3600)).toBe(0);
    expect(resumePositionSeconds(0, 3600)).toBe(0);
    expect(resumePositionSeconds(1, 3600)).toBe(0);
  });

  it("starts from the beginning when the video is essentially finished", () => {
    expect(resumePositionSeconds(3598, 3600)).toBe(0);
  });
});

describe("preserveResumePosition", () => {
  it("keeps the saved position when a new session reports time near zero", () => {
    const lastAt = new Date("2026-09-09T10:00:00.000Z");
    const now = new Date("2026-09-09T10:30:00.000Z");
    expect(preserveResumePosition(1800, lastAt, 0, 3600, now)).toBe(1800);
  });

  it("stores a rewind when the user is still in the same watching session", () => {
    const lastAt = new Date("2026-09-09T10:00:00.000Z");
    const now = new Date("2026-09-09T10:00:08.000Z");
    expect(preserveResumePosition(1800, lastAt, 0, 3600, now)).toBe(0);
  });
});
