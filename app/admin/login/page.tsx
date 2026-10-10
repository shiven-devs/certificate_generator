import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { hasAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Admin
        </h1>
        <p className="mt-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
          Sign in to review certificate requests.
        </p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
