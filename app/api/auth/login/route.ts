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
import { loginSchema } from "@/schemas/auth.schema";
import { login } from "@/services/auth.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const limit = limiter.consume(clientKey(request, "login"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many login attempts. Please try again in a few minutes.",
        429,
      );
    }

    const body = await parseJsonBody(request, loginSchema);
    await connectDb();
    const result = await login(body);
    await setAuthCookie(result.token);

    return jsonSuccess({ user: result.user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
