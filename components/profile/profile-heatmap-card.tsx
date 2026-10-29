import { formatWatchedHours } from "@/lib/activity/intensity";
import type { ActivityOverview } from "@/services/activity.service";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";

export function ProfileHeatmapCard({
  activity,
  name,
}: {
  activity: ActivityOverview;
  name: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Consistency
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Times shown in {activity.timeZone}
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Current streak" value={`${activity.currentStreak}d`} />
        <Stat label="Longest streak" value={`${activity.longestStreak}d`} />
        <Stat label="Active days" value={String(activity.totalActiveDays)} />
        <Stat
          label="Watched (1 year)"
          value={formatWatchedHours(activity.totalWatchedSeconds)}
        />
      </dl>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Darker squares mean more credited watch time that day. Scroll sideways to see
        earlier months.
      </p>
      <div className="mt-4">
        <ActivityHeatmap months={activity.months} />
      </div>
      <p className="sr-only">Study heatmap for {name}.</p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
        {value}
      </dd>
    </div>
  );
}
