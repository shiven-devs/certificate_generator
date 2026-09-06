import { connectDb } from "@/lib/db/connect";
import { setAuthCookie } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  clientKey,
  createMemoryRateLimiter,
} from "@/lib/rate-limit/memory";
import { parseJsonBody } from "@/lib/validation/parse";
import { signupSchema } from "@/schemas/auth.schema";
import { signup } from "@/services/auth.service";

const limiter = createMemoryRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const limit = limiter.consume(clientKey(request, "signup"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many signup attempts. Please try again later.",
        429,
      );
    }

    const body = await parseJsonBody(request, signupSchema);
    await connectDb();
    const result = await signup(body);
    await setAuthCookie(result.token);

    return jsonSuccess({ user: result.user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
