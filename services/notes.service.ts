import { createHash } from "node:crypto";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { isNotionConfigured } from "@/lib/config/env";
import { derivePageTitle, MAX_NOTE_PAGES } from "@/lib/notes/pages";
import { notionApiRequest, notionFailureToAppError } from "@/lib/notion/client";
import { buildNotionNoteMarkdown } from "@/lib/notion/markdown";
import { refreshNotionAccessToken } from "@/lib/notion/oauth";
import {
  deleteNotionConnection,
  findNotionConnectionPublic,
  findNotionTokens,
  upsertNotionConnection,
  type StoredNotionTokens,
} from "@/repositories/notion-connection.repository";
import {
  deleteNotePage,
  emptyLessonNote,
  ensureLessonNotePages,
  findLessonNote,
  saveNotePage,
  setNotePageNotionPage,
  toPublicLessonNote,
  type PublicLessonNote,
} from "@/repositories/lesson-note.repository";
import { getCourseForUser } from "@/services/course.service";

export async function getLessonNote(
  userId: string,
  courseId: string,
  youtubeVideoId: string,
): Promise<PublicLessonNote> {
  await assertLessonAccess(userId, courseId, youtubeVideoId);
  const note = await findLessonNote(userId, courseId, youtubeVideoId);
  if (!note) {
    return emptyLessonNote(courseId, youtubeVideoId);
  }
  return toPublicLessonNote(await ensureLessonNotePages(note));
}

export async function saveLessonNotePage(
  userId: string,
  input: {
    courseId: string;
    youtubeVideoId: string;
    pageId: string;
    body: string;
  },
): Promise<PublicLessonNote> {
  await assertLessonAccess(userId, input.courseId, input.youtubeVideoId);
  const { note, capReached } = await saveNotePage({
    userId,
    courseId: input.courseId,
    youtubeVideoId: input.youtubeVideoId,
    pageId: input.pageId,
    body: input.body,
  });

  if (capReached) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `You can keep up to ${MAX_NOTE_PAGES} note pages per lesson.`,
      400,
    );
  }
  if (!note) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      "Could not save this note page. Please try again.",
      500,
    );
  }

  return toPublicLessonNote(note);
}

export async function deleteLessonNotePage(
  userId: string,
  input: { courseId: string; youtubeVideoId: string; pageId: string },
): Promise<PublicLessonNote> {
  await assertLessonAccess(userId, input.courseId, input.youtubeVideoId);
  const existing = await findLessonNote(userId, input.courseId, input.youtubeVideoId);
  if (!existing) {
    return emptyLessonNote(input.courseId, input.youtubeVideoId);
  }

  await ensureLessonNotePages(existing);
  const note = await deleteNotePage({
    userId,
    courseId: input.courseId,
    youtubeVideoId: input.youtubeVideoId,
    pageId: input.pageId,
  });

  return note
    ? toPublicLessonNote(note)
    : emptyLessonNote(input.courseId, input.youtubeVideoId);
}

export async function getNotionStatus(userId: string): Promise<{
  configured: boolean;
  connected: boolean;
  workspaceName: string | null;
}> {
  const configured = isNotionConfigured();
  if (!configured) {
    return { configured: false, connected: false, workspaceName: null };
  }

  const connection = await findNotionConnectionPublic(userId);
  return {
    configured: true,
    connected: Boolean(connection),
    workspaceName: connection?.workspaceName ?? null,
  };
}

export async function disconnectNotion(userId: string): Promise<void> {
  await deleteNotionConnection(userId);
}

/**
 * Pushes every page of a lesson note to Notion, one Notion page per note page.
 * Pages whose content has not changed since their last sync are skipped, so
 * re-syncing a lesson only costs an API call for what the learner edited.
 */
export async function syncLessonNoteToNotion(
  userId: string,
  input: { courseId: string; youtubeVideoId: string },
): Promise<{ note: PublicLessonNote; syncedPages: number }> {
  const { course, item } = await assertLessonAccess(
    userId,
    input.courseId,
    input.youtubeVideoId,
  );

  const existing = await findLessonNote(userId, input.courseId, input.youtubeVideoId);
  const note = existing ? await ensureLessonNotePages(existing) : null;
  const pages = note ? [...note.pages] : [];
  const syncable = pages.filter(
    (page) => page.body.trim().length > 0 || page.notionPageId,
  );

  if (syncable.length === 0) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      "Write something in these lesson notes before syncing to Notion.",
      400,
    );
  }

  let tokens = await findNotionTokens(userId);
  if (!tokens) {
    throw new AppError(
      ErrorCodes.NOTION_NOT_CONNECTED,
      "Connect Notion first to sync this note.",
      409,
    );
  }

  let latest = note;
  let syncedPages = 0;

  for (const [index, page] of pages.entries()) {
    if (page.body.trim().length === 0 && !page.notionPageId) {
      continue;
    }

    const markdown = buildNotionNoteMarkdown({
      courseTitle: course.title,
      lessonTitle: item.title,
      body: page.body,
      pageTitle: index === 0 ? null : derivePageTitle(page.body, index),
    });
    const hash = createHash("sha256").update(markdown).digest("hex");
    if (page.notionPageId && page.lastSyncedHash === hash) {
      continue;
    }

    const result = await upsertNotionPage({
      tokens,
      userId,
      existingPageId: page.notionPageId,
      markdown,
    });
    tokens = result.tokens;

    const updated = await setNotePageNotionPage({
      userId,
      courseId: input.courseId,
      youtubeVideoId: input.youtubeVideoId,
      pageId: page.id,
      notionPageId: result.pageId,
      lastSyncedHash: hash,
    });
    if (updated) {
      latest = updated;
    }
    syncedPages += 1;
  }

  return {
    note: latest
      ? toPublicLessonNote(latest)
      : emptyLessonNote(input.courseId, input.youtubeVideoId),
    syncedPages,
  };
}

async function upsertNotionPage(input: {
  tokens: StoredNotionTokens;
  userId: string;
  existingPageId: string | null | undefined;
  markdown: string;
}): Promise<{ pageId: string; tokens: StoredNotionTokens }> {
  const run = async (
    tokens: StoredNotionTokens,
    allowRefresh: boolean,
  ): Promise<{ pageId: string; tokens: StoredNotionTokens }> => {
    if (input.existingPageId) {
      const updated = await notionApiRequest({
        accessToken: tokens.accessToken,
        path: `/pages/${input.existingPageId}/markdown`,
        method: "PATCH",
        body: {
          type: "replace_content",
          replace_content: {
            new_str: input.markdown,
            allow_deleting_content: true,
          },
        },
      });

      if (updated.ok) {
        return { pageId: input.existingPageId, tokens };
      }

      if (updated.status === 401 && allowRefresh) {
        const refreshed = await refreshAndStore(input.userId, tokens.refreshToken);
        return run(refreshed, false);
      }

      if (updated.status === 404 || updated.code === "object_not_found") {
        return createNotionPage(tokens, input.markdown, input.userId, allowRefresh);
      }

      throw notionFailureToAppError(updated.status, updated.code);
    }

    return createNotionPage(tokens, input.markdown, input.userId, allowRefresh);
  };

  return run(input.tokens, true);
}

async function createNotionPage(
  tokens: StoredNotionTokens,
  markdown: string,
  userId: string,
  allowRefresh: boolean,
): Promise<{ pageId: string; tokens: StoredNotionTokens }> {
  const created = await notionApiRequest<{ id?: unknown }>({
    accessToken: tokens.accessToken,
    path: "/pages",
    method: "POST",
    body: {
      parent: { type: "workspace", workspace: true },
      markdown,
    },
  });

  if (!created.ok) {
    if (created.status === 401 && allowRefresh) {
      const refreshed = await refreshAndStore(userId, tokens.refreshToken);
      return createNotionPage(refreshed, markdown, userId, false);
    }
    throw notionFailureToAppError(created.status, created.code);
  }

  if (typeof created.data.id !== "string" || !created.data.id) {
    throw new AppError(
      ErrorCodes.NOTION_SYNC_FAILED,
      "Could not sync this note to Notion. Please try again.",
      502,
    );
  }

  return { pageId: created.data.id, tokens };
}

async function refreshAndStore(
  userId: string,
  refreshToken: string,
): Promise<StoredNotionTokens> {
  try {
    const next = await refreshNotionAccessToken(refreshToken);
    await upsertNotionConnection(userId, next);
    return next;
  } catch (error) {
    await deleteNotionConnection(userId);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCodes.NOTION_NOT_CONNECTED,
      "Reconnect Notion to keep syncing your notes.",
      401,
    );
  }
}

async function assertLessonAccess(
  userId: string,
  courseId: string,
  youtubeVideoId: string,
) {
  const { course } = await getCourseForUser(userId, courseId);
  const item = course.items.find((row) => row.youtubeVideoId === youtubeVideoId);
  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, "This lesson is not in the course.", 404);
  }
  return { course, item };
}
