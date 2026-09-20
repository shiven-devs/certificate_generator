import { describe, expect, it } from "vitest";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { googleProfileFromIdTokenPayload } from "@/lib/auth/google-oauth";
import { googleAuthErrorQuery } from "@/lib/auth/google-redirect";

describe("googleProfileFromIdTokenPayload", () => {
  it("maps a verified Google identity", () => {
    expect(
      googleProfileFromIdTokenPayload({
        sub: "google-user-1",
        email: "Ada@Example.com",
        email_verified: true,
        name: "Ada Lovelace",
      }),
    ).toEqual({
      googleId: "google-user-1",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  it("rejects unverified emails", () => {
    expect(() =>
      googleProfileFromIdTokenPayload({
        sub: "google-user-1",
        email: "ada@example.com",
        email_verified: false,
        name: "Ada",
      }),
    ).toThrow(AppError);
  });
});

describe("googleAuthErrorQuery", () => {
  it("maps known Google auth failures to safe query values", () => {
    expect(
      googleAuthErrorQuery(
        new AppError(ErrorCodes.GOOGLE_NOT_CONFIGURED, "unavailable", 503),
      ),
    ).toBe("google_not_configured");
    expect(googleAuthErrorQuery(new Error("boom"))).toBe("google_failed");
  });
});
