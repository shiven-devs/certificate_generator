import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { SessionKickNotice } from "@/components/auth/session-kick-notice";
import { resolveSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await resolveSession();
  if (session.status === "authenticated") {
    redirect("/dashboard");
  }

  const { reason } = await searchParams;
  const kicked =
    session.status === "invalidated" || reason === "session-invalidated";

  return (
    <>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Welcome back
        </h1>
        <p className={`mt-2 text-sm text-slate-600 dark:text-slate-400 ${kicked ? "mb-4" : "mb-6"}`}>
        Sign in to continue your courses.
      </p>
      {kicked ? <SessionKickNotice /> : null}
      <LoginForm />
    </>
  );
}
