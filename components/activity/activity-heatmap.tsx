import { monthLabel } from "@/lib/activity/calendar";
import type { PublicActivityDay } from "@/services/activity.service";

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
  if (day.count === 0) {
    return `${day.date}: no activity`;
  }

  const parts: string[] = [];
  if (day.lessonCompletions > 0) {
    parts.push(
      `${day.lessonCompletions} ${day.lessonCompletions === 1 ? "lesson" : "lessons"} completed`,
    );
  }
  if (day.checkIn) {
    parts.push("checked in");
  }
  return `${day.date}: ${parts.join(", ")}`;
}

export function ActivityHeatmap({ days }: { days: PublicActivityDay[] }) {
  const weeks: PublicActivityDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const monthLabels = weeks.map((week) => {
    const monthStart = week.find((day) => day.date.endsWith("-01"));
    return monthStart ? monthLabel(monthStart.date) : "";
  });

  return (
    <div className="min-w-0">
      <div className="flex items-end gap-1">
        <div className="flex shrink-0 flex-col gap-1 pt-5">
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
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex justify-end">
            <div className="w-max">
              <div className="relative mb-1 h-4">
                {monthLabels.map((label, index) =>
                  label ? (
                    <span
                      key={`${label}-${index}`}
                      className="absolute top-0 text-[10px] leading-4 text-slate-500 dark:text-slate-400"
                      style={{ left: `${index * 16}px` }}
                    >
                      {label}
                    </span>
                  ) : null,
                )}
              </div>
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={week[0]?.date ?? weekIndex} className="flex w-3 flex-col gap-1">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        title={dayCaption(day)}
                        className={`size-3 rounded-[3px] ${
                          day.isFuture ? "bg-transparent" : LEVEL_CLASS[day.level]
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400">
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
