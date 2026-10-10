import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { CertificateRequestList } from "@/components/admin/certificate-request-list";
import { hasAdminSession } from "@/lib/auth/admin-session";
import { connectDb } from "@/lib/db/connect";
import { listCertificateRequests } from "@/services/certificate-review.service";

export const metadata: Metadata = {
  title: "Certificate requests",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  await connectDb();
  const requests = await listCertificateRequests();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Certificate requests
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Approve a finished course to open the certificate download. Reject it to ask the learner to contact the developer.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <div className="mt-8">
        <CertificateRequestList requests={requests} />
      </div>
    </main>
  );
}
