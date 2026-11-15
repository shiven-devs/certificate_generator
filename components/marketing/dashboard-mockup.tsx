const LEVEL_CLASS = [
  "bg-slate-100 dark:bg-slate-800",
  "bg-emerald-200 dark:bg-[#0e4429]",
  "bg-emerald-400 dark:bg-[#006d32]",
  "bg-emerald-500 dark:bg-[#26a641]",
  "bg-emerald-600 dark:bg-[#39d353]",
] as const;

const WEEKS = 20;

/** Deterministic sample activity so server and client render the same grid. */
function sampleLevel(week: number, day: number): number {
  const seed = (week * 7 + day) * 2654435761;
  const noise = ((seed >>> 0) % 100) / 100;
  const ramp = week / WEEKS;
  if (noise > 0.35 + ramp * 0.5) return 0;
  return Math.min(4, 1 + Math.floor(noise * 4 * (0.6 + ramp)));
}

const SAMPLE_COURSES = [
  { title: "React from scratch", lessons: "18 / 24 lessons", percent: 75 },
  { title: "Linear algebra, lecture series", lessons: "9 / 30 lessons", percent: 30 },
  { title: "System design basics", lessons: "1 / 1 lesson", percent: 100 },
] as const;

/** Illustration of the dashboard for the landing page hero. Decorative only. */
export function DashboardMockup() {
  return (
    <div
      aria-hidden="true"
      className="marketing-float w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span className="h-3 w-3 rounded-full bg-rose-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-3 truncate rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          certitube.vercel.app/dashboard
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Current streak", value: "🔥 12 days" },
            { label: "Longest streak", value: "31 days" },
            { label: "Hours watched", value: "46.5 h" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            Consistency
          </p>
          <div className="flex gap-[3px] overflow-hidden">
            {Array.from({ length: WEEKS }, (_, week) => (
              <div key={week} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, day) => (
                  <span
                    key={day}
                    className={`h-2.5 w-2.5 rounded-[3px] sm:h-3 sm:w-3 ${LEVEL_CLASS[sampleLevel(week, day)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {SAMPLE_COURSES.map((course) => (
            <li
              key={course.title}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <span className="h-9 w-14 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {course.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${course.percent}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                    {course.lessons}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
