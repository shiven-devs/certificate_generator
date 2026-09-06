import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/youtube/duration";
import { certificatePath } from "@/lib/certificates/path";
import type { EnrollmentListItem } from "@/services/enrollment.service";

export function CourseCard({ item }: { item: EnrollmentListItem }) {
  const { course, enrollment } = item;
  const completedCount = enrollment.itemProgress.filter((row) => row.completed).length;
  const total = course.items.length || 1;
  const percent = Math.round((completedCount / total) * 100);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {course.thumbnailUrl ? (
        <Image
          src={course.thumbnailUrl}
          alt=""
          width={640}
          height={360}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-slate-100" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {course.items.length} {course.items.length === 1 ? "video" : "videos"} ·{" "}
          {formatDuration(course.totalDurationSeconds)}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          {enrollment.status === "completed" ? "Completed" : `${percent}% complete`}
        </p>
        <div className="mt-4 grid gap-2">
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {enrollment.status === "completed" ? "View course" : "Continue"}
          </Link>
          {enrollment.status === "completed" ? (
            <a
              href={enrollment.certificateUrl ?? certificatePath(enrollment.id)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Download certificate
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
