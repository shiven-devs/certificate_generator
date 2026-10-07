import Image from "next/image";
import type { PublicCertificateDetails } from "@/services/certificate.service";
import { formatCertificateDate } from "@/lib/certificates/text";

export function CertificateVerifyView({ details }: { details: PublicCertificateDetails }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-slate-800">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Verified certificate
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {details.learnerName}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Completed {details.courseTitle} on {formatCertificateDate(details.completedAt)}.
        </p>
      </div>

      <dl className="grid gap-4 border-b border-slate-200 px-5 py-5 sm:grid-cols-2 sm:px-6 dark:border-slate-800">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Course hours
          </dt>
          <dd className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
            {details.courseHoursLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Lessons
          </dt>
          <dd className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
            {details.videos.length}
          </dd>
        </div>
      </dl>

      <div className="px-5 py-5 sm:px-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          {details.thumbnailUrl ? (
            <Image
              src={details.thumbnailUrl}
              alt=""
              width={640}
              height={360}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800" />
          )}
          <p className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
            {details.courseTitle}
          </p>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-slate-900 dark:text-slate-100">Videos</h2>
        <ul className="mt-3 grid gap-3">
          {details.videos.map((video) => (
            <li
              key={video.youtubeVideoId}
              className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <Image
                src={video.thumbnailUrl}
                alt=""
                width={160}
                height={90}
                className="h-[72px] w-32 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{video.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{video.durationLabel}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
