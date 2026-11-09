"use client";

import { useState } from "react";
import { useLessonNotes } from "@/hooks/use-lesson-notes";
import { NotesEditor } from "@/components/player/notes-editor";

const SAVE_LABELS = {
  idle: "Saved on this device",
  saving: "Saving…",
  saved: "Saved on this device",
  error: "Could not save",
} as const;

const LOADING_LABEL = "Loading…";

// Every label the status slot can show. All of them are rendered stacked so the
// slot keeps one constant width: otherwise a short label ("Saving…") lets the
// header fit on one line while a long one ("Saved on this device") wraps to two,
// and the editor jumps up and down on every keystroke.
const STATUS_LABELS = Array.from(
  new Set<string>([LOADING_LABEL, ...Object.values(SAVE_LABELS)]),
);

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
  const [focusPageId, setFocusPageId] = useState<string | null>(null);

  const statusLabel =
    notes.loadState === "loading" ? LOADING_LABEL : SAVE_LABELS[notes.saveState];

  const syncLabel = {
    idle: "Sync with Notion",
    syncing: "Syncing…",
    synced: "Synced with Notion",
    error: "Sync with Notion",
  }[notes.syncState];

  const editorDisabled =
    !enabled || notes.loadState === "loading" || !notes.activePageId;

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
        <div className="grid shrink-0 justify-items-end">
          {STATUS_LABELS.map((label) => (
            <p
              key={label}
              aria-hidden={label !== statusLabel}
              className={`col-start-1 row-start-1 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400 ${
                label === statusLabel ? "" : "invisible"
              }`}
            >
              {label}
            </p>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <NotesEditor
          key={notes.activePageId ?? "no-page"}
          value={notes.activePage?.body ?? ""}
          onChange={notes.setBody}
          disabled={editorDisabled}
          pages={notes.pages}
          activePageId={notes.activePageId}
          canAddPage={notes.canAddPage}
          onSelectPage={(pageId) => {
            // Only a freshly created page claims focus, not every revisit.
            setFocusPageId(null);
            notes.selectPage(pageId);
          }}
          onAddPage={() => {
            const created = notes.addPage();
            if (created) {
              setFocusPageId(created);
            }
          }}
          onDeletePage={(pageId) => void notes.deletePage(pageId)}
          autoFocus={notes.activePageId !== null && notes.activePageId === focusPageId}
        />
        {notes.message ? (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              notes.syncState === "error" ||
              notes.saveState === "error" ||
              notes.loadState === "error"
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
        {notes.activePage?.lastSyncedAt ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {notes.pages.length > 1 ? "This page last synced" : "Last Notion sync"}{" "}
            {new Date(notes.activePage.lastSyncedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    </section>
  );
}
