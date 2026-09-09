import Image from "next/image";
import Link from "next/link";
import { certificatePath } from "@/lib/certificates/path";
import type { EnrollmentListItem } from "@/services/enrollment.service";

export function CertificateCard({ item }: { item: EnrollmentListItem }) {
  const { course, enrollment } = item;
  const completedOn = enrollment.completedAt
    ? enrollment.completedAt.toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Completed";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Certificate ready
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{course.title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{completedOn}</p>
        <div className="mt-4 grid gap-2">
          <a
            href={enrollment.certificateUrl ?? certificatePath(enrollment.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Download PDF
          </a>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View course
          </Link>
        </div>
      </div>
    </article>
  );
}
