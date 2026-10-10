import { describe, expect, it } from "vitest";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createPkcePair,
  createSignedOAuthState,
  googleProfileFromIdTokenPayload,
  readSignedOAuthState,
} from "@/lib/auth/google-oauth";
import { googleAuthErrorQuery } from "@/lib/auth/google-redirect";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/certitube";
process.env.JWT_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.ADMIN_ID ??= "test-admin";
process.env.ADMIN_PASSWORD ??= "test-admin-password";

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
    expect(
      googleAuthErrorQuery(
        new AppError(ErrorCodes.GOOGLE_STATE_INVALID, "expired", 401),
      ),
    ).toBe("google_state_invalid");
    expect(
      googleAuthErrorQuery(
        new AppError(ErrorCodes.GOOGLE_INVALID_CLIENT, "bad secret", 401),
      ),
    ).toBe("google_invalid_client");
  });
});

describe("signed Google OAuth state", () => {
  it("round-trips the PKCE verifier", async () => {
    const { verifier } = createPkcePair();
    const state = await createSignedOAuthState(verifier);
    expect(await readSignedOAuthState(state)).toBe(verifier);
  });

  it("rejects a tampered state value", async () => {
    const { verifier } = createPkcePair();
    const state = await createSignedOAuthState(verifier);
    expect(await readSignedOAuthState(`${state}x`)).toBeNull();
  });
});
