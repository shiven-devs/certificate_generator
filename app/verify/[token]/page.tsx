import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db/connect";
import { certificatesEnabled } from "@/lib/config/features";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { CertificateVerifyView } from "@/components/certificates/certificate-verify-view";
import { certificateVerifyTokenSchema } from "@/schemas/certificate.schema";
import { getPublicCertificateDetails } from "@/services/certificate.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate details",
  robots: { index: false, follow: false },
};

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!certificatesEnabled()) {
    notFound();
  }

  const { token } = await params;
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const limit = limiter.consume(`certificate-verify:${ip}`);

  if (!limit.allowed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Please wait</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Too many certificate lookups from this network. Try again in a few minutes.
        </p>
      </div>
    );
  }

  const parsed = certificateVerifyTokenSchema.safeParse({ token });
  if (!parsed.success) {
    notFound();
  }

  await connectDb();

  let details;
  try {
    details = await getPublicCertificateDetails(parsed.data.token);
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.NOT_FOUND) {
      notFound();
    }
    throw error;
  }

  return <CertificateVerifyView details={details} />;
}
