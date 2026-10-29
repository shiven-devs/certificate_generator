import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Profile not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This profile link is invalid or the learner has not set one up.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
      >
        Go to Certitube
      </Link>
    </div>
  );
}
