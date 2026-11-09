"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { ErrorCodes } from "@/lib/errors/app-error";
import { MAX_NOTE_PAGES, newNotePageId } from "@/lib/notes/pages";
import type { PublicLessonNote, PublicNotePage } from "@/lib/notes/types";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";

type NotionStatus = {
  configured: boolean;
  connected: boolean;
  workspaceName: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type SyncState = "idle" | "syncing" | "synced" | "error";

type PendingSave = {
  courseId: string;
  youtubeVideoId: string;
  pageId: string;
  body: string;
};

const SAVE_DEBOUNCE_MS = 900;
const PENDING_SYNC_KEY = "certitube:notion-sync-pending";

function blankPage(): PublicNotePage {
  return { id: newNotePageId(), body: "", notionPageId: null, lastSyncedAt: null };
}

function pendingKey(youtubeVideoId: string, pageId: string): string {
  return `${youtubeVideoId}:${pageId}`;
}

export function useLessonNotes(input: {
  courseId: string;
  youtubeVideoId: string | null;
  enabled: boolean;
  notionReturn: string | null;
}) {
  const redirectIfKicked = useSessionErrorRedirect();
  const [pages, setPages] = useState<PublicNotePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const pagesRef = useRef<PublicNotePage[]>([]);
  const activePageIdRef = useRef<string | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  // Edits waiting to be written, keyed by lesson + page so switching lessons or
  // pages mid-debounce still saves what was typed.
  const pendingRef = useRef(new Map<string, PendingSave>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHandleNotionReturn = useRef(false);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    loadedVideoIdRef.current = loadedVideoId;
  }, [loadedVideoId]);

  const returnMessage =
    input.notionReturn && input.notionReturn !== "connected"
      ? notionReturnMessage(input.notionReturn)
      : null;
  const message = actionMessage ?? returnMessage;

  /** Takes page ids and Notion state from the server, keeps bodies local. */
  const mergeNote = useCallback((note: PublicLessonNote) => {
    const fallback = blankPage();
    setPages((prev) => {
      const localBodies = new Map(prev.map((page) => [page.id, page.body]));
      const merged: PublicNotePage[] = note.pages.map((page) => {
        const localBody = localBodies.get(page.id);
        return localBody === undefined ? page : { ...page, body: localBody };
      });
      for (const page of prev) {
        if (!note.pages.some((row) => row.id === page.id)) {
          merged.push(page);
        }
      }
      return merged.length > 0 ? merged : [fallback];
    });
  }, []);

  const flushPending = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const entries = Array.from(pendingRef.current.values());
    if (entries.length === 0) {
      return true;
    }
    pendingRef.current.clear();
    setSaveState("saving");

    for (const entry of entries) {
      const result = await apiRequest<{ note: PublicLessonNote }>("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!result.ok) {
        if (redirectIfKicked(result.error)) {
          return false;
        }
        setSaveState("error");
        setActionMessage(result.error.message);
        return false;
      }

      if (result.data.note.youtubeVideoId === loadedVideoIdRef.current) {
        mergeNote(result.data.note);
      }
    }

    setSaveState("saved");
    return true;
  }, [mergeNote, redirectIfKicked]);

  const scheduleFlush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void flushPending();
    }, SAVE_DEBOUNCE_MS);
  }, [flushPending]);

  useEffect(() => {
    if (!input.enabled || !input.youtubeVideoId) {
      return;
    }

    const videoId = input.youtubeVideoId;
    const courseId = input.courseId;
    let cancelled = false;

    const params = new URLSearchParams({
      courseId,
      youtubeVideoId: videoId,
    });

    void (async () => {
      const [noteResult, statusResult] = await Promise.all([
        apiRequest<{ note: PublicLessonNote }>(`/api/notes?${params}`),
        apiRequest<NotionStatus>("/api/notion/status"),
      ]);
      if (cancelled) {
        return;
      }
      if (!noteResult.ok) {
        if (redirectIfKicked(noteResult.error)) {
          return;
        }
        setLoadState("error");
        setActionMessage(noteResult.error.message);
        return;
      }
      const status = statusResult.ok ? statusResult.data : null;
      if (status) {
        setNotion(status);
      }

      const loaded = noteResult.data.note.pages;
      const initial = loaded.length > 0 ? loaded : [blankPage()];
      pagesRef.current = initial;
      activePageIdRef.current = initial[0].id;
      loadedVideoIdRef.current = videoId;
      setPages(initial);
      setSelectedPageId(initial[0].id);
      setLoadedVideoId(videoId);
      setSaveState("idle");
      setLoadState("ready");

      if (input.notionReturn !== "connected" || didHandleNotionReturn.current) {
        return;
      }
      didHandleNotionReturn.current = true;

      const raw = sessionStorage.getItem(PENDING_SYNC_KEY);
      sessionStorage.removeItem(PENDING_SYNC_KEY);
      let shouldSync = false;
      if (raw) {
        try {
          const pending = JSON.parse(raw) as {
            courseId?: string;
            youtubeVideoId?: string;
          };
          shouldSync =
            pending.courseId === courseId && pending.youtubeVideoId === videoId;
        } catch {
          shouldSync = false;
        }
      }

      if (!shouldSync) {
        setActionMessage(
          "Notion is connected. Click Sync with Notion to copy this lesson.",
        );
        return;
      }

      setSyncState("syncing");
      const syncResult = await apiRequest<{
        note: PublicLessonNote;
        syncedPages: number;
      }>("/api/notes/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, youtubeVideoId: videoId }),
      });
      if (cancelled) {
        return;
      }
      if (!syncResult.ok) {
        setSyncState("error");
        setActionMessage(syncResult.error.message);
        return;
      }
      mergeNote(syncResult.data.note);
      setSyncState("synced");
      setNotion((current) =>
        current ? { ...current, connected: true } : current,
      );
      setActionMessage(syncedMessage(syncResult.data.syncedPages));
    })();

    return () => {
      cancelled = true;
      // Leaving this lesson: write whatever is still sitting in the debounce.
      void flushPending();
    };
  }, [
    flushPending,
    input.courseId,
    input.enabled,
    input.notionReturn,
    input.youtubeVideoId,
    mergeNote,
    redirectIfKicked,
  ]);

  useEffect(() => {
    return () => {
      void flushPending();
    };
  }, [flushPending]);

  const setBody = useCallback(
    (next: string) => {
      const pageId = activePageIdRef.current;
      const videoId = loadedVideoIdRef.current;
      if (!pageId || !videoId || videoId !== input.youtubeVideoId) {
        return;
      }

      setPages((prev) =>
        prev.map((page) => (page.id === pageId ? { ...page, body: next } : page)),
      );
      pendingRef.current.set(pendingKey(videoId, pageId), {
        courseId: input.courseId,
        youtubeVideoId: videoId,
        pageId,
        body: next,
      });
      scheduleFlush();
    },
    [input.courseId, input.youtubeVideoId, scheduleFlush],
  );

  const selectPage = useCallback(
    (pageId: string) => {
      if (pageId === activePageIdRef.current) {
        return;
      }
      if (!pagesRef.current.some((page) => page.id === pageId)) {
        return;
      }
      void flushPending();
      activePageIdRef.current = pageId;
      setSelectedPageId(pageId);
    },
    [flushPending],
  );

  /** Adds an empty page locally; it reaches the server on its first edit. */
  const addPage = useCallback((): string | null => {
    const videoId = loadedVideoIdRef.current;
    if (!videoId || videoId !== input.youtubeVideoId) {
      return null;
    }
    if (pagesRef.current.length >= MAX_NOTE_PAGES) {
      setActionMessage(`You can keep up to ${MAX_NOTE_PAGES} note pages per lesson.`);
      return null;
    }

    void flushPending();
    const page = blankPage();
    pagesRef.current = [...pagesRef.current, page];
    activePageIdRef.current = page.id;
    setPages((prev) => (prev.length >= MAX_NOTE_PAGES ? prev : [...prev, page]));
    setSelectedPageId(page.id);
    setActionMessage(null);
    return page.id;
  }, [flushPending, input.youtubeVideoId]);

  const deletePage = useCallback(
    async (pageId: string) => {
      const current = pagesRef.current;
      const videoId = loadedVideoIdRef.current;
      const index = current.findIndex((page) => page.id === pageId);
      if (!videoId || index === -1 || current.length <= 1) {
        return;
      }

      const remaining = current.filter((page) => page.id !== pageId);
      pendingRef.current.delete(pendingKey(videoId, pageId));
      pagesRef.current = remaining;
      setPages(remaining);
      if (activePageIdRef.current === pageId) {
        const nextActive = remaining[Math.max(0, index - 1)];
        activePageIdRef.current = nextActive.id;
        setSelectedPageId(nextActive.id);
      }

      const params = new URLSearchParams({
        courseId: input.courseId,
        youtubeVideoId: videoId,
        pageId,
      });
      const result = await apiRequest<{ note: PublicLessonNote }>(
        `/api/notes/pages?${params}`,
        { method: "DELETE" },
      );
      if (!result.ok) {
        if (redirectIfKicked(result.error)) {
          return;
        }
        setActionMessage(result.error.message);
        return;
      }
      if (result.data.note.youtubeVideoId === loadedVideoIdRef.current) {
        mergeNote(result.data.note);
      }
    },
    [input.courseId, mergeNote, redirectIfKicked],
  );

  const beginNotionConnect = useCallback(async () => {
    if (!input.youtubeVideoId) {
      return;
    }
    await flushPending();
    sessionStorage.setItem(
      PENDING_SYNC_KEY,
      JSON.stringify({
        courseId: input.courseId,
        youtubeVideoId: input.youtubeVideoId,
      }),
    );
    // Full document navigation is required so Notion can redirect back to the callback.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- OAuth start must leave the Next client router
    window.location.assign(
      `/api/notion/connect?courseId=${encodeURIComponent(input.courseId)}`,
    );
  }, [flushPending, input.courseId, input.youtubeVideoId]);

  const syncWithNotion = useCallback(async () => {
    if (!input.youtubeVideoId) {
      return;
    }

    if (notion && !notion.configured) {
      setSyncState("error");
      setActionMessage("Notion sync is not set up on this site yet.");
      return;
    }

    if (notion && !notion.connected) {
      await beginNotionConnect();
      return;
    }

    setSyncState("syncing");
    setActionMessage(null);

    if (!(await flushPending())) {
      setSyncState("idle");
      return;
    }

    const result = await apiRequest<{
      note: PublicLessonNote;
      syncedPages: number;
    }>("/api/notes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: input.courseId,
        youtubeVideoId: input.youtubeVideoId,
      }),
    });

    if (!result.ok) {
      if (redirectIfKicked(result.error)) {
        return;
      }
      if (result.error.code === ErrorCodes.NOTION_NOT_CONNECTED) {
        await beginNotionConnect();
        return;
      }
      setSyncState("error");
      setActionMessage(result.error.message);
      return;
    }

    mergeNote(result.data.note);
    setSyncState("synced");
    setNotion((current) =>
      current ? { ...current, connected: true } : current,
    );
    setActionMessage(syncedMessage(result.data.syncedPages));
  }, [
    beginNotionConnect,
    flushPending,
    input.courseId,
    input.youtubeVideoId,
    mergeNote,
    notion,
    redirectIfKicked,
  ]);

  // Derived rather than stored, so a selection that no longer exists falls
  // back to the first page instead of leaving the editor without one.
  const activePage = useMemo(() => {
    if (pages.length === 0) {
      return null;
    }
    return pages.find((page) => page.id === selectedPageId) ?? pages[0];
  }, [pages, selectedPageId]);

  useEffect(() => {
    activePageIdRef.current = activePage?.id ?? null;
  }, [activePage]);

  return {
    pages,
    activePage,
    activePageId: activePage?.id ?? null,
    selectPage,
    setBody,
    addPage,
    deletePage,
    canAddPage: pages.length < MAX_NOTE_PAGES,
    loadState,
    saveState,
    syncState,
    message,
    notion,
    syncWithNotion,
  };
}

function syncedMessage(syncedPages: number): string {
  if (syncedPages <= 0) {
    return "Your Notion pages are already up to date.";
  }
  return syncedPages === 1
    ? "Synced 1 page to your Notion workspace."
    : `Synced ${syncedPages} pages to your Notion workspace.`;
}

function notionReturnMessage(code: string): string {
  switch (code) {
    case "denied":
      return "Notion access was cancelled. You can connect later from Sync with Notion.";
    case "not_configured":
      return "Notion sync is not set up on this site yet.";
    case "expired":
      return "The Notion connection expired. Please try again.";
    case "rate_limited":
      return "Too many Notion attempts. Please wait a moment and try again.";
    default:
      return "Could not connect to Notion. Please try again.";
  }
}
