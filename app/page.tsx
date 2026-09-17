import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveSession } from "@/lib/auth/session";
import { redirectIfSessionInvalidated } from "@/lib/auth/session-redirect";
import { SiteHeader } from "@/components/layout/site-header";

export default async function HomePage() {
  const session = await resolveSession();
  redirectIfSessionInvalidated(session);
  if (session.status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <SiteHeader user={null} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-24">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
            YouTube learning, with proof
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Watch a course. Earn a certificate you actually completed.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Paste a YouTube video or playlist, watch it in-app with a real 1.5x speed cap,
            and receive a certificate only after the server confirms you finished.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create a free account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Log in
            </Link>
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How it works</h2>
          <ol className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <span className="font-medium text-slate-900 dark:text-slate-100">1. Enroll from a URL.</span>{" "}
              We fetch the video or playlist metadata before you commit.
            </li>
            <li>
              <span className="font-medium text-slate-900 dark:text-slate-100">2. Watch at your pace.</span>{" "}
              Playlist lessons can be watched in any order. Progress is credited on the server, not from the player UI.
            </li>
            <li>
              <span className="font-medium text-slate-900 dark:text-slate-100">3. Get certified.</span>{" "}
              Your name and the course title are rendered onto the certificate template.
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
