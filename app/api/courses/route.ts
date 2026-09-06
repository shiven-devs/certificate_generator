import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { parseJsonBody } from "@/lib/validation/parse";
import { createCourseSchema } from "@/schemas/course.schema";
import { enrollFromUrl } from "@/services/course.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const limit = limiter.consume(userRateLimitKey(user.id, "course-create"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many enrollments. Please wait a few minutes.",
        429,
      );
    }

    const body = await parseJsonBody(request, createCourseSchema);
    await connectDb();
    const result = await enrollFromUrl(user.id, body.url);
    return jsonSuccess(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
