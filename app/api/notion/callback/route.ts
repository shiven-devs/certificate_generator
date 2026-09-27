import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { getPublicOrigin } from "@/lib/http/public-origin";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { upsertNotionConnection } from "@/repositories/notion-connection.repository";
import {
  exchangeNotionAuthorizationCode,
  notionCallbackUrl,
  readNotionOAuthState,
} from "@/lib/notion/oauth";
import { courseIdParamSchema } from "@/schemas/course.schema";

const callbackLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
  let courseId: string | null = null;

  try {
    const user = await requireUser();
    const limit = callbackLimiter.consume(
      clientKey(request, "notion-oauth-callback"),
    );
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many Notion connect attempts. Please try again later.",
        429,
      );
    }

    const url = new URL(request.url);
    const providerError = url.searchParams.get("error");
    if (providerError === "access_denied") {
      return redirectNotionResult(origin, null, "denied");
    }
    if (providerError) {
      console.error("Notion returned an OAuth error:", providerError);
      return redirectNotionResult(origin, null, "failed");
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const parsedState = state ? await readNotionOAuthState(state) : null;

    if (!code || !parsedState) {
      throw new AppError(
        ErrorCodes.NOTION_STATE_INVALID,
        "Notion connection expired or was interrupted. Please try again.",
        401,
      );
    }

    if (parsedState.userId !== user.id) {
      throw new AppError(
        ErrorCodes.NOTION_STATE_INVALID,
        "Notion connection expired or was interrupted. Please try again.",
        401,
      );
    }

    courseId = parseCourseId(parsedState.courseId);

    const tokens = await exchangeNotionAuthorizationCode({
      code,
      redirectUri: notionCallbackUrl(origin),
    });

    await connectDb();
    await upsertNotionConnection(user.id, tokens);

    return redirectNotionResult(origin, courseId, "connected");
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.UNAUTHENTICATED) {
      return NextResponse.redirect(new URL("/login", origin));
    }
    if (!(error instanceof AppError)) {
      console.error("Notion connect failed with an unexpected error");
    }
    return redirectNotionResult(origin, courseId, notionCallbackError(error));
  }
}

function parseCourseId(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const parsed = courseIdParamSchema.safeParse({ courseId: value });
  return parsed.success ? parsed.data.courseId : null;
}

function redirectNotionResult(
  origin: string,
  courseId: string | null,
  status: string,
): NextResponse {
  const path = courseId ? `/courses/${courseId}` : "/dashboard";
  const url = new URL(path, origin);
  url.searchParams.set("notion", status);
  return NextResponse.redirect(url);
}

function notionCallbackError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === ErrorCodes.UNAUTHENTICATED) {
      return "signin";
    }
    if (error.code === ErrorCodes.NOTION_NOT_CONFIGURED) {
      return "not_configured";
    }
    if (error.code === ErrorCodes.NOTION_STATE_INVALID) {
      return "expired";
    }
    if (error.code === ErrorCodes.RATE_LIMITED) {
      return "rate_limited";
    }
  }
  return "failed";
}
