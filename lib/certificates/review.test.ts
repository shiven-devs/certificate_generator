import { describe, expect, it } from "vitest";
import {
  certificateFieldsOnCompletion,
  effectiveCertificateReview,
  youtubeCourseUrl,
} from "@/lib/certificates/review";

describe("certificate review", () => {
  const now = new Date("2026-10-10T12:00:00.000Z");

  it("opens a pending request when a course is completed", () => {
    expect(
      certificateFieldsOnCompletion({
        courseCompleted: true,
        now,
        completedAt: null,
        certificateReview: "none",
        certificateUrl: null,
      }),
    ).toEqual({
      status: "completed",
      completedAt: now,
      certificateReview: "pending",
      certificateRequestedAt: now,
    });
  });

  it("does not issue a certificate URL on completion", () => {
    const fields = certificateFieldsOnCompletion({
      courseCompleted: true,
      now,
      completedAt: null,
      certificateReview: null,
      certificateUrl: null,
    });

    expect(fields).not.toHaveProperty("certificateUrl");
  });

  it("keeps an existing review decision on later heartbeats", () => {
    expect(
      certificateFieldsOnCompletion({
        courseCompleted: true,
        now,
        completedAt: new Date("2026-10-01T00:00:00.000Z"),
        certificateReview: "rejected",
        certificateUrl: null,
      }),
    ).toEqual({
      status: "completed",
      completedAt: new Date("2026-10-01T00:00:00.000Z"),
    });
  });

  it("treats certificates issued before review as approved", () => {
    expect(
      effectiveCertificateReview({
        status: "completed",
        certificateReview: null,
        certificateUrl: "/api/certificates/abc",
      }),
    ).toBe("approved");
  });

  it("builds a YouTube course URL only from a safe id", () => {
    expect(youtubeCourseUrl("video", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(youtubeCourseUrl("playlist", "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")).toBe(
      "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
    );
    expect(youtubeCourseUrl("video", "https://evil.example")).toBeNull();
  });
});
