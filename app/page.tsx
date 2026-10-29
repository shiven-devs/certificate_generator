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
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader user={null} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-24">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
            YouTube learning, measured
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Study with focus. Build a streak. Share the proof.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Paste a YouTube video or playlist, study it in a focused player, and get a
            profile page that shows how consistently you study and what you have
            finished.
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
              <span className="font-medium text-slate-900 dark:text-slate-100">3. Share your profile.</span>{" "}
              Lectures you finish land on your profile page, next to your consistency heatmap. You decide what stays on it.
            </li>
          </ol>
        </div>
      </main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          A place to finish what you start
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Daily check-in</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Check in each day you study and keep a streak beside your courses.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Study heatmap</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              A watch-time heatmap shows which days you studied and how long you stayed with a course.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Distraction-free study</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Watch lessons in a focused player, with notes beside the video and a fullscreen view when you want the rest of the page out of the way.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">A profile you can share</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              One link shows your streaks, your study heatmap, and the lectures you
              completed here. Remove any course you would rather not show.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Structured learning</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              A playlist becomes a course: a lesson list, saved progress, and a clear path from the first video to the last.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
