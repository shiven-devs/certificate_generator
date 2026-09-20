import { NextResponse } from "next/server";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  googleOAuthCookieOptions,
} from "@/lib/auth/google-oauth";

export function clearGoogleOAuthCookies(response: NextResponse): void {
  const expired = { ...googleOAuthCookieOptions(), maxAge: 0 };
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", expired);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, "", expired);
}

export function redirectToLoginWithGoogleError(
  request: Request,
  error: string,
): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  clearGoogleOAuthCookies(response);
  return response;
}

export function googleAuthErrorQuery(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.GOOGLE_NOT_CONFIGURED:
        return "google_not_configured";
      case ErrorCodes.GOOGLE_EMAIL_UNVERIFIED:
        return "google_unverified";
      case ErrorCodes.RATE_LIMITED:
        return "google_rate_limited";
      default:
        return "google_failed";
    }
  }

  return "google_failed";
}
