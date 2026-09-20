import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  googleCallbackUrl,
  googleOAuthCookieOptions,
} from "@/lib/auth/google-oauth";
import {
  googleAuthErrorQuery,
  redirectToLoginWithGoogleError,
} from "@/lib/auth/google-redirect";
import { getPublicOrigin } from "@/lib/http/public-origin";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";

const startLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export async function GET(request: Request) {
  try {
    const limit = startLimiter.consume(clientKey(request, "google-oauth-start"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many Google sign-in attempts. Please try again later.",
        429,
      );
    }

    const origin = getPublicOrigin(request);
    const redirectUri = googleCallbackUrl(origin);
    const state = createOAuthState();
    const { verifier, challenge } = createPkcePair();
    const authorizationUrl = buildGoogleAuthorizationUrl({
      redirectUri,
      state,
      challenge,
    });

    const response = NextResponse.redirect(authorizationUrl);
    const cookieOptions = googleOAuthCookieOptions();
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, verifier, cookieOptions);
    return response;
  } catch (error) {
    return redirectToLoginWithGoogleError(request, googleAuthErrorQuery(error));
  }
}
