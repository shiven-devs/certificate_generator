import { connectDb } from "@/lib/db/connect";
import { resolveSession } from "@/lib/auth/session";
import { listMyEnrollments } from "@/services/enrollment.service";
import { getActivityOverview } from "@/services/activity.service";
import { AddCourseForm } from "@/components/courses/add-course-form";
import { CourseCard } from "@/components/courses/course-card";
import { ActivityPanel } from "@/components/activity/activity-panel";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return null;
  }

  await connectDb();
  const [enrollments, activity] = await Promise.all([
    listMyEnrollments(session.user.id),
    getActivityOverview(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          My courses
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Welcome back, {session.user.name}.
        </p>
      </div>
      <ActivityPanel initial={activity} />
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Your public profile
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Share your consistency heatmap and the lectures you have completed. You
            choose what appears.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Open profile
        </Link>
      </section>
      <AddCourseForm />
      {enrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">No courses yet</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Preview a YouTube URL above to start your first course.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((item) => (
            <CourseCard key={item.enrollment.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
