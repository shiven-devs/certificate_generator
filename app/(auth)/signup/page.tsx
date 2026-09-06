import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { resolveSession } from "@/lib/auth/session";
import { redirectIfSessionInvalidated } from "@/lib/auth/session-redirect";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage() {
  const session = await resolveSession();
  redirectIfSessionInvalidated(session);
  if (session.status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create your account
      </h1>
      <p className="mt-2 mb-6 text-sm text-slate-600">
        Start watching. Certificates unlock only after genuine completion.
      </p>
      <SignupForm />
    </>
  );
}
