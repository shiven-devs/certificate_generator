import {
  adminCredentialsMatch,
  setAdminCookie,
  signAdminToken,
} from "@/lib/auth/admin-session";
import { isAdminAuthConfigured } from "@/lib/config/env";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonError, jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { parseJsonBody } from "@/lib/validation/parse";
import { adminLoginSchema } from "@/schemas/admin.schema";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const limit = limiter.consume(clientKey(request, "admin-login"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many sign-in attempts. Please try again in a few minutes.",
        429,
      );
    }

    if (!isAdminAuthConfigured()) {
      return jsonError(
        ErrorCodes.INTERNAL_ERROR,
        "Admin sign-in is not configured.",
        503,
      );
    }

    const body = await parseJsonBody(request, adminLoginSchema);
    if (!adminCredentialsMatch(body.adminId, body.password)) {
      return jsonError(
        ErrorCodes.INVALID_CREDENTIALS,
        "Invalid admin credentials.",
        401,
      );
    }

    await setAdminCookie(await signAdminToken());
    return jsonSuccess({ signedIn: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
