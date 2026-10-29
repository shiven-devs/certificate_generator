import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { certificatesEnabled } from "@/lib/config/features";
import { resolveSession } from "@/lib/auth/session";
import { listMyCertificates } from "@/services/certificate.service";
import { CertificateCard } from "@/components/certificates/certificate-card";

export const metadata: Metadata = {
  title: "Certificates",
};

export default async function CertificatesPage() {
  if (!certificatesEnabled()) {
    notFound();
  }

  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return null;
  }

  await connectDb();
  const certificates = await listMyCertificates(session.user.id);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Certificates
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Finished courses are listed here. The download opens after the request is approved.
        </p>
      </div>
      {certificates.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">No certificates yet</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Finish a course to request a certificate. The download opens after review.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((item) => (
            <CertificateCard key={item.enrollment.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
