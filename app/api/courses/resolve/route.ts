import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { parseSearchParams } from "@/lib/validation/parse";
import { resolveCourseQuerySchema } from "@/schemas/course.schema";
import { previewCourseFromUrl } from "@/services/course.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const limit = limiter.consume(userRateLimitKey(user.id, "course-resolve"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many course lookups. Please wait a few minutes.",
        429,
      );
    }

    const { url } = parseSearchParams(request.url, resolveCourseQuerySchema);
    await connectDb();
    const preview = await previewCourseFromUrl(url);
    return jsonSuccess({ preview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
