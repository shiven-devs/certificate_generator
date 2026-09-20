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
import { checkInSchema } from "@/schemas/activity.schema";
import { checkInToday } from "@/services/activity.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();

    const limit = limiter.consume(userRateLimitKey(user.id, "check-in"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many check-in attempts. Please wait a moment.",
        429,
      );
    }

    const body = await parseJsonBody(request, checkInSchema);
    await connectDb();
    const activity = await checkInToday(user.id, body.timeZone);
    return jsonSuccess({ activity });
  } catch (error) {
    return toErrorResponse(error);
  }
}
