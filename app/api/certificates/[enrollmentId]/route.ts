import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { getPublicOrigin } from "@/lib/http/public-origin";
import { jsonError, jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { certificateParamsSchema } from "@/schemas/certificate.schema";
import {
  certificateFilename,
  generateCertificatePdf,
  issueCertificate,
} from "@/services/certificate.service";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

async function authorizeCertificateRequest(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  const user = await requireUser();
  const parsed = certificateParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return { error: jsonError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404) };
  }

  const limit = limiter.consume(
    userRateLimitKey(user.id, `certificate:${parsed.data.enrollmentId}`),
  );
  if (!limit.allowed) {
    throw new AppError(
      ErrorCodes.RATE_LIMITED,
      "Too many certificate requests. Please wait a few minutes.",
      429,
    );
  }

  return { user, enrollmentId: parsed.data.enrollmentId };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    const authorized = await authorizeCertificateRequest(request, context);
    if ("error" in authorized) {
      return authorized.error;
    }

    await connectDb();
    const pdf = await generateCertificatePdf({
      user: authorized.user,
      enrollmentId: authorized.enrollmentId,
      origin: getPublicOrigin(request),
    });
    const body = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;
    const filename = certificateFilename(authorized.user.name);

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    assertSameOrigin(request);
    const authorized = await authorizeCertificateRequest(request, context);
    if ("error" in authorized) {
      return authorized.error;
    }

    await connectDb();
    const result = await issueCertificate({
      user: authorized.user,
      enrollmentId: authorized.enrollmentId,
    });
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
