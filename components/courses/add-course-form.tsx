"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";
import { formatDuration } from "@/lib/youtube/duration";
import { itemIssueLabel } from "@/lib/youtube/issues";
import { skippedPreviewItems } from "@/lib/youtube/playable";
import type { CoursePreview } from "@/lib/youtube/types";
import type { PublicCourse } from "@/repositories/course.repository";

type PreviewResponse = { preview: CoursePreview };
type EnrollResponse = { course: PublicCourse };

export function AddCourseForm() {
  const router = useRouter();
  const redirectIfKicked = useSessionErrorRedirect();
  const [url, setUrl] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [preview, setPreview] = useState<CoursePreview | null>(null);

  async function onPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldError(undefined);
    setPreview(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setFieldError("Paste a YouTube URL.");
      return;
    }

    setIsResolving(true);
    try {
      const query = new URLSearchParams({ url: trimmed });
      const result = await apiRequest<PreviewResponse>(
        `/api/courses/resolve?${query.toString()}`,
      );
      if (!result.ok) {
        if (redirectIfKicked(result.error)) {
          return;
        }
        setFormError(result.error.message);
        return;
      }
      setPreview(result.data.preview);
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setIsResolving(false);
    }
  }

  async function onEnroll() {
    if (!preview) {
      return;
    }
    setFormError(null);
    setIsEnrolling(true);
    try {
      const result = await apiRequest<EnrollResponse>("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!result.ok) {
        if (redirectIfKicked(result.error)) {
          return;
        }
        setFormError(result.error.message);
        return;
      }
      router.push(`/courses/${result.data.course.id}`);
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setIsEnrolling(false);
    }
  }

  const skipped = preview ? skippedPreviewItems(preview) : [];
  const playableCount = preview?.items.filter((item) => item.playable).length ?? 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add a course</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Paste a YouTube video or playlist URL. We will preview it before you enroll.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onPreview}>
        <div className="flex-1">
          <Input
            name="url"
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            error={fieldError}
            inputMode="url"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={isResolving} className="sm:w-36">
          {isResolving ? "Looking up…" : "Preview"}
        </Button>
      </form>
      {formError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
      {preview ? (
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[12rem_1fr] dark:border-slate-800">
          {preview.thumbnailUrl ? (
            <Image
              src={preview.thumbnailUrl}
              alt=""
              width={320}
              height={180}
              className="aspect-video w-full rounded-lg object-cover sm:w-48"
              loading="eager"
            />
          ) : (
            <div className="aspect-video w-full rounded-lg bg-slate-100 sm:w-48 dark:bg-slate-800" />
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {preview.sourceType === "playlist" ? "Playlist" : "Video"}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{preview.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {playableCount} {playableCount === 1 ? "video" : "videos"} ·{" "}
              {formatDuration(preview.totalDurationSeconds)}
            </p>
            {skipped.length > 0 && preview.enrollable ? (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
                {skipped.length === 1
                  ? "1 video in this playlist cannot be played here and will be skipped."
                  : `${skipped.length} videos in this playlist cannot be played here and will be skipped.`}
              </p>
            ) : null}
            {!preview.enrollable ? (
              <p className="mt-3 text-sm text-red-700 dark:text-red-400">
                None of these videos can be watched here. They may be private, deleted,
                live, or not embeddable.
              </p>
            ) : null}
            {preview.items.length > 1 ? (
              <ol className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
                {preview.items.map((item) => (
                  <li key={`${item.order}-${item.youtubeVideoId}`}>
                    {item.order + 1}. {item.title}
                    {!item.playable && item.issue ? (
                      <span className="text-red-600 dark:text-red-400"> — {itemIssueLabel(item.issue)}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
            <Button
              className="mt-4"
              onClick={() => void onEnroll()}
              disabled={!preview.enrollable || isEnrolling}
            >
              {isEnrolling ? "Enrolling…" : "Enroll in this course"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
