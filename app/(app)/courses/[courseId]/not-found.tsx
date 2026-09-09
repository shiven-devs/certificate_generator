import Link from "next/link";

export default function CourseNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Course not found</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This course does not exist, or you are not enrolled in it.
      </p>
      <Link href="/dashboard" className="mt-6 text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400">
        Back to my courses
      </Link>
    </div>
  );
}
