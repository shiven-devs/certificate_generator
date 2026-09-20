import { NextResponse } from "next/server";
import { applyAuthCookie } from "@/lib/auth/cookies";
import {
  exchangeGoogleAuthorizationCode,
  googleCallbackUrl,
  readSignedOAuthState,
} from "@/lib/auth/google-oauth";
import {
  googleAuthErrorQuery,
  redirectToLoginWithGoogleError,
} from "@/lib/auth/google-redirect";
import { connectDb } from "@/lib/db/connect";
import { getPublicOrigin } from "@/lib/http/public-origin";
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

    const origin = getPublicOrigin(request);
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
    const verifier = state ? await readSignedOAuthState(state) : null;

    if (!code || !verifier) {
      throw new AppError(
        ErrorCodes.GOOGLE_STATE_INVALID,
        "Google sign-in expired or was interrupted. Please try again.",
        401,
      );
    }

    const profile = await exchangeGoogleAuthorizationCode({
      code,
      redirectUri: googleCallbackUrl(origin),
      verifier,
    });

    await connectDb();
    const result = await loginWithGoogle(profile);

    const response = NextResponse.redirect(new URL("/dashboard", origin));
    applyAuthCookie(response, result.token);
    return response;
  } catch (error) {
    if (!(error instanceof AppError)) {
      console.error("Google sign-in failed with an unexpected error");
    }
    return redirectToLoginWithGoogleError(request, googleAuthErrorQuery(error));
  }
}
