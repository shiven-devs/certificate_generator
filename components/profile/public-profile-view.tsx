import type { PublicProfile } from "@/services/profile.service";
import { ProfileCourseCard } from "@/components/profile/profile-course-card";
import { ProfileHeatmapCard } from "@/components/profile/profile-heatmap-card";

function memberSinceLabel(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function PublicProfileView({ profile, courses, activity }: PublicProfile) {
  const memberSince = memberSinceLabel(profile.memberSince);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {profile.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          @{profile.handle}
          {memberSince ? ` · Learning here since ${memberSince}` : null}
        </p>
        {profile.headline ? (
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {profile.headline}
          </p>
        ) : null}
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Stat label="Courses completed" value={profile.completedCourseCount} />
          <Stat label="Lectures completed" value={profile.completedLessonCount} />
          <Stat label="Current streak" value={`${profile.currentStreak}d`} />
          <Stat label="Longest streak" value={`${profile.longestStreak}d`} />
        </dl>
      </section>

      {activity ? <ProfileHeatmapCard activity={activity} name={profile.name} /> : null}

      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Learning on Certitube
        </h2>
        {courses.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No courses on this profile yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <ProfileCourseCard key={course.enrollmentId} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
        {value}
      </dd>
    </div>
  );
}
