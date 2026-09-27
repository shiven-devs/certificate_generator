import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getPublicOrigin } from "@/lib/http/public-origin";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import {
  buildNotionAuthorizationUrl,
  createNotionOAuthState,
  notionCallbackUrl,
} from "@/lib/notion/oauth";
import { parseSearchParams } from "@/lib/validation/parse";
import { notionConnectQuerySchema } from "@/schemas/notes.schema";

const startLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
  try {
    const user = await requireUser();
    const limit = startLimiter.consume(clientKey(request, "notion-oauth-start"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many Notion connect attempts. Please try again later.",
        429,
      );
    }

    const query = parseSearchParams(request.url, notionConnectQuerySchema);
    const redirectUri = notionCallbackUrl(origin);
    const state = await createNotionOAuthState({
      userId: user.id,
      courseId: query.courseId ?? null,
    });
    const authorizationUrl = buildNotionAuthorizationUrl({
      redirectUri,
      state,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.UNAUTHENTICATED) {
      return NextResponse.redirect(new URL("/login", origin));
    }
    return redirectWithNotionError(origin, error, null);
  }
}

function redirectWithNotionError(
  origin: string,
  error: unknown,
  courseId: string | null,
): NextResponse {
  const path = courseId ? `/courses/${courseId}` : "/dashboard";
  const url = new URL(path, origin);
  url.searchParams.set("notion", notionErrorQuery(error));
  return NextResponse.redirect(url);
}

function notionErrorQuery(error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === ErrorCodes.UNAUTHENTICATED) {
      return "signin";
    }
    if (error.code === ErrorCodes.NOTION_NOT_CONFIGURED) {
      return "not_configured";
    }
    if (error.code === ErrorCodes.RATE_LIMITED) {
      return "rate_limited";
    }
  }
  return "failed";
}
