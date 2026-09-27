"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { ErrorCodes } from "@/lib/errors/app-error";
import type { PublicLessonNote } from "@/lib/notes/types";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";

type NotionStatus = {
  configured: boolean;
  connected: boolean;
  workspaceName: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type SyncState = "idle" | "syncing" | "synced" | "error";

const SAVE_DEBOUNCE_MS = 900;
const PENDING_SYNC_KEY = "certitube:notion-sync-pending";

export function useLessonNotes(input: {
  courseId: string;
  youtubeVideoId: string | null;
  enabled: boolean;
  notionReturn: string | null;
}) {
  const redirectIfKicked = useSessionErrorRedirect();
  const [body, setBody] = useState("");
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [note, setNote] = useState<PublicLessonNote | null>(null);
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const bodyRef = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHandleNotionReturn = useRef(false);

  const returnMessage =
    input.notionReturn && input.notionReturn !== "connected"
      ? notionReturnMessage(input.notionReturn)
      : null;
  const message = actionMessage ?? returnMessage;

  const updateBody = useCallback((next: string) => {
    bodyRef.current = next;
    setBody(next);
  }, []);

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
      setNote(noteResult.data.note);
      bodyRef.current = noteResult.data.note.body;
      setBody(noteResult.data.note.body);
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
      const syncResult = await apiRequest<{ note: PublicLessonNote }>("/api/notes/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          youtubeVideoId: videoId,
          body: bodyRef.current,
        }),
      });
      if (cancelled) {
        return;
      }
      if (!syncResult.ok) {
        setSyncState("error");
        setActionMessage(syncResult.error.message);
        return;
      }
      setNote(syncResult.data.note);
      setSyncState("synced");
      setNotion((current) =>
        current ? { ...current, connected: true } : current,
      );
      setActionMessage("Synced to your Notion workspace.");
    })();

    return () => {
      cancelled = true;
    };
  }, [input.courseId, input.enabled, input.notionReturn, input.youtubeVideoId, redirectIfKicked]);

  const flushSave = useCallback(async () => {
    if (!input.youtubeVideoId || loadedVideoId !== input.youtubeVideoId) {
      return;
    }

    setSaveState("saving");
    const result = await apiRequest<{ note: PublicLessonNote }>("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: input.courseId,
        youtubeVideoId: input.youtubeVideoId,
        body: bodyRef.current,
      }),
    });

    if (!result.ok) {
      if (redirectIfKicked(result.error)) {
        return;
      }
      setSaveState("error");
      setActionMessage(result.error.message);
      return;
    }

    setNote(result.data.note);
    setSaveState("saved");
  }, [input.courseId, input.youtubeVideoId, loadedVideoId, redirectIfKicked]);

  useEffect(() => {
    if (loadState !== "ready" || loadedVideoId !== input.youtubeVideoId) {
      return;
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [body, flushSave, input.youtubeVideoId, loadState, loadedVideoId]);

  const beginNotionConnect = useCallback(async () => {
    if (!input.youtubeVideoId) {
      return;
    }
    await flushSave();
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
  }, [flushSave, input.courseId, input.youtubeVideoId]);

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
    const result = await apiRequest<{ note: PublicLessonNote }>("/api/notes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: input.courseId,
        youtubeVideoId: input.youtubeVideoId,
        body: bodyRef.current,
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

    setNote(result.data.note);
    setSyncState("synced");
    setNotion((current) =>
      current ? { ...current, connected: true } : current,
    );
    setActionMessage("Synced to your Notion workspace.");
  }, [
    beginNotionConnect,
    input.courseId,
    input.youtubeVideoId,
    notion,
    redirectIfKicked,
  ]);

  return {
    body,
    setBody: updateBody,
    loadState,
    saveState,
    syncState,
    message,
    note,
    notion,
    syncWithNotion,
  };
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
