import Image from "next/image";
import type { ReactNode } from "react";
import { formatDuration } from "@/lib/youtube/duration";
import type { ProfileCourse } from "@/services/profile.service";

export function ProfileCourseCard({
  course,
  action,
  dimmed = false,
}: {
  course: ProfileCourse;
  action?: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      {course.thumbnailUrl ? (
        <Image
          src={course.thumbnailUrl}
          alt=""
          width={640}
          height={360}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {course.youtubeUrl ? (
              <a
                href={course.youtubeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:underline"
              >
                {course.title}
              </a>
            ) : (
              course.title
            )}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
              course.completed
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {course.completed ? "Completed" : "In progress"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {course.completedLessonCount} of {course.lessonCount}{" "}
          {course.lessonCount === 1 ? "lecture" : "lectures"} completed ·{" "}
          {course.watchedLabel} watched
        </p>
        {course.lessons.length > 0 ? (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-sm font-medium text-indigo-700 dark:text-indigo-400">
              Completed lectures
            </summary>
            <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              {course.lessons.map((lesson) => (
                <li key={lesson.youtubeVideoId} className="flex gap-2">
                  <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{lesson.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDuration(lesson.durationSeconds)} ·{" "}
                      {lesson.creditedPercent}% credited
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </article>
  );
}
