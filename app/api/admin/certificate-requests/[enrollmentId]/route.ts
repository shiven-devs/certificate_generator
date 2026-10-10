import { connectDb } from "@/lib/db/connect";
import { requireAdmin } from "@/lib/auth/admin-session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonError, jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { clientKey, createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { certificateParamsSchema } from "@/schemas/certificate.schema";
import { certificateDecisionSchema } from "@/schemas/admin.schema";
import { parseJsonBody } from "@/lib/validation/parse";
import { decideCertificateRequest } from "@/services/certificate-review.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

export async function POST(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    assertSameOrigin(request);
    await requireAdmin();

    const limit = limiter.consume(clientKey(request, "admin-certificate-review"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many review actions. Please wait a few minutes.",
        429,
      );
    }

    const params = certificateParamsSchema.safeParse(await context.params);
    if (!params.success) {
      return jsonError(ErrorCodes.NOT_FOUND, "Certificate request not found.", 404);
    }

    const body = await parseJsonBody(request, certificateDecisionSchema);
    await connectDb();
    const requestView = await decideCertificateRequest(
      params.data.enrollmentId,
      body.decision,
    );
    return jsonSuccess({ request: requestView });
  } catch (error) {
    return toErrorResponse(error);
  }
}
