import { NextResponse } from "next/server";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { getPublicOrigin } from "@/lib/http/public-origin";

export function redirectToLoginWithGoogleError(
  request: Request,
  error: string,
): NextResponse {
  const loginUrl = new URL("/login", getPublicOrigin(request));
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export function googleAuthErrorQuery(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.GOOGLE_NOT_CONFIGURED:
        return "google_not_configured";
      case ErrorCodes.GOOGLE_EMAIL_UNVERIFIED:
        return "google_unverified";
      case ErrorCodes.GOOGLE_STATE_INVALID:
        return "google_state_invalid";
      case ErrorCodes.GOOGLE_INVALID_CLIENT:
        return "google_invalid_client";
      case ErrorCodes.GOOGLE_REDIRECT_MISMATCH:
        return "google_redirect_mismatch";
      case ErrorCodes.RATE_LIMITED:
        return "google_rate_limited";
      default:
        return "google_failed";
    }
  }

  return "google_failed";
}
