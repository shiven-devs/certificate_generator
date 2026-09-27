"use client";

import { useLessonNotes } from "@/hooks/use-lesson-notes";

export function LessonNotesPanel({
  courseId,
  youtubeVideoId,
  lessonTitle,
  enabled,
  notionReturn,
  compact,
}: {
  courseId: string;
  youtubeVideoId: string | null;
  lessonTitle: string;
  enabled: boolean;
  notionReturn: string | null;
  compact?: boolean;
}) {
  const notes = useLessonNotes({
    courseId,
    youtubeVideoId,
    enabled,
    notionReturn,
  });

  const saveLabel = {
    idle: "Saved on this device",
    saving: "Saving…",
    saved: "Saved on this device",
    error: "Could not save",
  }[notes.saveState];

  const syncLabel = {
    idle: "Sync with Notion",
    syncing: "Syncing…",
    synced: "Synced with Notion",
    error: "Sync with Notion",
  }[notes.syncState];

  return (
    <section
      className={`flex min-h-0 flex-col border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
        compact ? "h-full border-l" : "border-t"
      }`}
      aria-labelledby="lesson-notes-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2
            id="lesson-notes-heading"
            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            Notes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {lessonTitle}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {notes.loadState === "loading" ? "Loading…" : saveLabel}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <label className="sr-only" htmlFor="lesson-notes-body">
          Lesson notes
        </label>
        <textarea
          id="lesson-notes-body"
          value={notes.body}
          onChange={(event) => notes.setBody(event.target.value)}
          disabled={!enabled || notes.loadState === "loading"}
          maxLength={50_000}
          placeholder="Write timestamps, summaries, or questions for this lesson."
          className="min-h-40 w-full flex-1 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900"
        />
        {notes.message ? (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              notes.syncState === "error" || notes.saveState === "error" || notes.loadState === "error"
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
            }`}
          >
            {notes.message}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void notes.syncWithNotion()}
            disabled={
              !enabled ||
              notes.loadState === "loading" ||
              notes.syncState === "syncing" ||
              notes.notion?.configured === false
            }
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {notes.notion && !notes.notion.connected ? "Connect Notion" : syncLabel}
          </button>
        {notes.notion?.configured === false ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Notion sync is not set up on this site yet. You can still save notes here.
          </p>
        ) : null}
        </div>
        {notes.note?.lastSyncedAt ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last Notion sync {new Date(notes.note.lastSyncedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    </section>
  );
}
