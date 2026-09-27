"use client";

import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { formatWatchedHours } from "@/lib/activity/intensity";
import type { HeatmapMonth, PublicActivityDay } from "@/services/activity.service";

const LEVEL_CLASS: Record<PublicActivityDay["level"], string> = {
  0: "bg-slate-200 dark:bg-[#2c2c2c]",
  1: "bg-emerald-200 dark:bg-[#0e4429]",
  2: "bg-emerald-400 dark:bg-[#006d32]",
  3: "bg-emerald-500 dark:bg-[#26a641]",
  4: "bg-emerald-600 dark:bg-[#39d353]",
};

type HeatmapTooltip = {
  label: string;
  x: number;
  y: number;
};

function dayCaption(day: PublicActivityDay): string {
  if (day.isFuture) {
    return `${day.date}: upcoming`;
  }
  return `${day.date}: ${formatWatchedHours(day.watchedSeconds)} watched`;
}

function showTooltipForCell(
  event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
  day: PublicActivityDay,
  setTooltip: (value: HeatmapTooltip | null) => void,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  setTooltip({
    label: dayCaption(day),
    x: rect.left + rect.width / 2,
    y: rect.top,
  });
}

export function ActivityHeatmap({ months }: { months: HeatmapMonth[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<HeatmapTooltip | null>(null);
  const [canPortal, setCanPortal] = useState(false);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }
    node.scrollLeft = node.scrollWidth;
  }, [months]);

  useEffect(() => {
    if (!tooltip) {
      return;
    }

    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    function hideOnScroll() {
      setTooltip(null);
    }

    window.addEventListener("scroll", hideOnScroll, true);
    scroller.addEventListener("scroll", hideOnScroll);

    return () => {
      window.removeEventListener("scroll", hideOnScroll, true);
      scroller.removeEventListener("scroll", hideOnScroll);
    };
  }, [tooltip]);

  return (
    <div className="min-w-0">
      <div
        ref={scrollerRef}
        className="overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        tabIndex={0}
        role="region"
        aria-label="Watch-time heatmap. Scroll horizontally to see earlier months."
      >
        <div className="flex w-max items-end gap-3 pr-1">
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
                          key={`${month.key}-${day.date}`}
                          role="img"
                          aria-label={dayCaption(day)}
                          className={`size-[11px] rounded-[2px] ${
                            day.isFuture ? "bg-transparent" : LEVEL_CLASS[day.level]
                          } ${day.isFuture ? "" : "cursor-default"}`}
                          onMouseEnter={(event) => showTooltipForCell(event, day, setTooltip)}
                          onMouseLeave={() => setTooltip(null)}
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
      {canPortal && tooltip
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              style={{ left: tooltip.x, top: tooltip.y - 6 }}
            >
              {tooltip.label}
            </div>,
            document.body,
          )
        : null}
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
