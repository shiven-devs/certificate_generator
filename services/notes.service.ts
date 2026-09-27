import { createHash } from "node:crypto";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { isNotionConfigured } from "@/lib/config/env";
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
  emptyLessonNote,
  findLessonNote,
  setLessonNoteNotionPage,
  toPublicLessonNote,
  upsertLessonNote,
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
  return note ? toPublicLessonNote(note) : emptyLessonNote(courseId, youtubeVideoId);
}

export async function saveLessonNote(
  userId: string,
  input: { courseId: string; youtubeVideoId: string; body: string },
): Promise<PublicLessonNote> {
  await assertLessonAccess(userId, input.courseId, input.youtubeVideoId);
  const note = await upsertLessonNote({
    userId,
    courseId: input.courseId,
    youtubeVideoId: input.youtubeVideoId,
    body: input.body,
  });
  return toPublicLessonNote(note);
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

export async function syncLessonNoteToNotion(
  userId: string,
  input: { courseId: string; youtubeVideoId: string; body: string },
): Promise<PublicLessonNote> {
  const { course, item } = await assertLessonAccess(
    userId,
    input.courseId,
    input.youtubeVideoId,
  );

  const saved = await upsertLessonNote({
    userId,
    courseId: input.courseId,
    youtubeVideoId: input.youtubeVideoId,
    body: input.body,
  });

  const markdown = buildNotionNoteMarkdown({
    courseTitle: course.title,
    lessonTitle: item.title,
    body: saved.body,
  });
  const hash = createHash("sha256").update(markdown).digest("hex");

  const tokens = await findNotionTokens(userId);
  if (!tokens) {
    throw new AppError(
      ErrorCodes.NOTION_NOT_CONNECTED,
      "Connect Notion first to sync this note.",
      409,
    );
  }

  const pageId = await upsertNotionPage({
    tokens,
    userId,
    existingPageId: saved.notionPageId,
    markdown,
  });

  const updated = await setLessonNoteNotionPage({
    userId,
    courseId: input.courseId,
    youtubeVideoId: input.youtubeVideoId,
    notionPageId: pageId,
    lastSyncedHash: hash,
  });

  return updated ? toPublicLessonNote(updated) : toPublicLessonNote(saved);
}

async function upsertNotionPage(input: {
  tokens: StoredNotionTokens;
  userId: string;
  existingPageId: string | null | undefined;
  markdown: string;
}): Promise<string> {
  const run = async (tokens: StoredNotionTokens, allowRefresh: boolean): Promise<string> => {
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
        return input.existingPageId;
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
): Promise<string> {
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

  return created.data.id;
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
