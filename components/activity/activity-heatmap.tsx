import { formatWatchedDuration } from "@/lib/activity/intensity";
import type { HeatmapMonth, PublicActivityDay } from "@/services/activity.service";

const LEVEL_CLASS: Record<PublicActivityDay["level"], string> = {
  0: "bg-slate-200 dark:bg-[#2c2c2c]",
  1: "bg-emerald-200 dark:bg-[#0e4429]",
  2: "bg-emerald-400 dark:bg-[#006d32]",
  3: "bg-emerald-500 dark:bg-[#26a641]",
  4: "bg-emerald-600 dark:bg-[#39d353]",
};

function dayCaption(day: PublicActivityDay): string {
  if (day.isFuture) {
    return `${day.date}: upcoming`;
  }
  if (day.watchedSeconds <= 0) {
    return `${day.date}: no watch time`;
  }
  return `${day.date}: ${formatWatchedDuration(day.watchedSeconds)}`;
}

export function ActivityHeatmap({ months }: { months: HeatmapMonth[] }) {
  return (
    <div className="min-w-0">
      <div className="overflow-hidden">
        <div className="flex justify-end">
          <div className="flex items-end gap-3">
            {months.map((month) => (
              <div key={month.key} className="flex flex-col items-stretch">
                <div className="flex gap-[3px]">
                  {month.weeks.map((week, weekIndex) => (
                    <div
                      key={`${month.key}-${weekIndex}`}
                      className="flex flex-col gap-[3px]"
                    >
                      {week.map((day, dayIndex) =>
                        day ? (
                          <div
                            key={day.date}
                            title={dayCaption(day)}
                            className={`size-[11px] rounded-[2px] ${
                              day.isFuture ? "bg-transparent" : LEVEL_CLASS[day.level]
                            }`}
                          />
                        ) : (
                          <div
                            key={`${month.key}-${weekIndex}-${dayIndex}`}
                            className="size-[11px]"
                            aria-hidden="true"
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] leading-none text-slate-500 dark:text-slate-400">
                  {month.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            className={`size-[11px] rounded-[2px] ${LEVEL_CLASS[level]}`}
            aria-hidden="true"
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
