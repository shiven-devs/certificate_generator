import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applyAuthCookie } from "@/lib/auth/cookies";
import {
  exchangeGoogleAuthorizationCode,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  googleCallbackUrl,
} from "@/lib/auth/google-oauth";
import {
  clearGoogleOAuthCookies,
  googleAuthErrorQuery,
  redirectToLoginWithGoogleError,
} from "@/lib/auth/google-redirect";
import { sessionIdsMatch } from "@/lib/auth/session-id";
import { connectDb } from "@/lib/db/connect";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { loginWithGoogle } from "@/services/auth.service";

const callbackLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export async function GET(request: Request) {
  try {
    const limit = callbackLimiter.consume(
      clientKey(request, "google-oauth-callback"),
    );
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many Google sign-in attempts. Please try again later.",
        429,
      );
    }

    const url = new URL(request.url);
    const providerError = url.searchParams.get("error");
    if (providerError === "access_denied") {
      return redirectToLoginWithGoogleError(request, "google_denied");
    }
    if (providerError) {
      return redirectToLoginWithGoogleError(request, "google_failed");
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const store = await cookies();
    const expectedState = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
    const verifier = store.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;

    if (
      !code ||
      !state ||
      !expectedState ||
      !verifier ||
      !sessionIdsMatch(expectedState, state)
    ) {
      return redirectToLoginWithGoogleError(request, "google_failed");
    }

    const profile = await exchangeGoogleAuthorizationCode({
      code,
      redirectUri: googleCallbackUrl(request.url),
      verifier,
    });

    await connectDb();
    const result = await loginWithGoogle(profile);

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    applyAuthCookie(response, result.token);
    clearGoogleOAuthCookies(response);
    return response;
  } catch (error) {
    return redirectToLoginWithGoogleError(request, googleAuthErrorQuery(error));
  }
}
