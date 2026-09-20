import { formatWatchedDuration } from "@/lib/activity/intensity";
import type { HeatmapMonth, PublicActivityDay } from "@/services/activity.service";

const LEVEL_CLASS: Record<PublicActivityDay["level"], string> = {
  0: "bg-slate-200 dark:bg-slate-800",
  1: "bg-indigo-200 dark:bg-indigo-950",
  2: "bg-indigo-400 dark:bg-indigo-800",
  3: "bg-indigo-600 dark:bg-indigo-600",
  4: "bg-indigo-800 dark:bg-indigo-400",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayCaption(day: PublicActivityDay): string {
  if (day.isFuture) {
    return `${day.date}: upcoming`;
  }
  if (day.watchedSeconds <= 0) {
    return `${day.date}: no watch time`;
  }
  return `${day.date}: ${formatWatchedDuration(day.watchedSeconds)}`;
}

function MonthBlock({ month }: { month: HeatmapMonth }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        {month.label}
      </p>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1">
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={label}
              className={`h-3 text-[10px] leading-3 text-slate-500 dark:text-slate-400 ${
                index % 2 === 1 ? "visible" : "invisible"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {month.weeks.map((week, weekIndex) => (
            <div key={`${month.key}-${weekIndex}`} className="flex w-3 flex-col gap-1">
              {week.map((day, dayIndex) =>
                day ? (
                  <div
                    key={day.date}
                    title={dayCaption(day)}
                    className={`size-3 rounded-[3px] ${
                      day.isFuture ? "bg-transparent" : LEVEL_CLASS[day.level]
                    }`}
                  />
                ) : (
                  <div
                    key={`${month.key}-${weekIndex}-${dayIndex}`}
                    className="size-3"
                    aria-hidden="true"
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivityHeatmap({ months }: { months: HeatmapMonth[] }) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
        {months.map((month) => (
          <MonthBlock key={month.key} month={month} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            className={`size-3 rounded-[3px] ${LEVEL_CLASS[level]}`}
            aria-hidden="true"
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
