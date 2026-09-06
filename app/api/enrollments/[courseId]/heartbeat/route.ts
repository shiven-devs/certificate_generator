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
import { courseIdParamSchema } from "@/schemas/course.schema";
import { heartbeatSchema } from "@/schemas/progress.schema";
import { recordHeartbeat } from "@/services/progress.service";

const limiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { courseId } = courseIdParamSchema.parse(await context.params);

    const limit = limiter.consume(userRateLimitKey(user.id, `heartbeat:${courseId}`));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many progress updates. Please wait a moment.",
        429,
      );
    }

    const body = await parseJsonBody(request, heartbeatSchema);
    await connectDb();
    const result = await recordHeartbeat(user.id, courseId, body);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
