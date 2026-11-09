import { Types } from "mongoose";
import { LessonNote, type LessonNoteDocument } from "@/models/lesson-note.model";
import { MAX_NOTE_PAGES, newNotePageId } from "@/lib/notes/pages";
import type { PublicLessonNote, PublicNotePage } from "@/lib/notes/types";

export type { PublicLessonNote, PublicNotePage };

function noteFilter(userId: string, courseId: string, youtubeVideoId: string) {
  return {
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId),
    youtubeVideoId,
  };
}

export function toPublicLessonNote(note: LessonNoteDocument): PublicLessonNote {
  return {
    courseId: note.course.toString(),
    youtubeVideoId: note.youtubeVideoId,
    pages: note.pages.map((page) => ({
      id: page.id,
      body: page.body,
      notionPageId: page.notionPageId ?? null,
      lastSyncedAt: page.lastSyncedAt ? page.lastSyncedAt.toISOString() : null,
    })),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function emptyLessonNote(
  courseId: string,
  youtubeVideoId: string,
): PublicLessonNote {
  return {
    courseId,
    youtubeVideoId,
    pages: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export async function findLessonNote(
  userId: string,
  courseId: string,
  youtubeVideoId: string,
) {
  return LessonNote.findOne(noteFilter(userId, courseId, youtubeVideoId)).exec();
}

/**
 * Moves a pre-pages note (single `body` on the document) into `pages[0]`, once.
 * Notes that already have pages, and empty notes that never held anything, are
 * returned untouched so this stays a no-op on the hot read path.
 */
export async function ensureLessonNotePages(
  note: LessonNoteDocument,
): Promise<LessonNoteDocument> {
  const legacyBody = note.body ?? "";
  const hasLegacyContent = Boolean(legacyBody.trim()) || Boolean(note.notionPageId);
  if (note.pages.length > 0 || !hasLegacyContent) {
    return note;
  }

  const id = note._id.toString();
  await LessonNote.updateOne(
    {
      _id: id,
      $or: [{ pages: { $exists: false } }, { pages: { $size: 0 } }],
    },
    {
      $set: {
        pages: [
          {
            id: newNotePageId(),
            body: legacyBody,
            notionPageId: note.notionPageId ?? null,
            lastSyncedAt: note.lastSyncedAt ?? null,
            lastSyncedHash: note.lastSyncedHash ?? null,
            updatedAt: note.updatedAt,
          },
        ],
        body: "",
        notionPageId: null,
        lastSyncedAt: null,
        lastSyncedHash: null,
      },
    },
  ).exec();

  return (await LessonNote.findById(id).exec()) ?? note;
}

/**
 * Writes one page, creating the note document and/or the page when missing.
 * `capReached` means the page is new and the lesson already holds the maximum.
 */
export async function saveNotePage(input: {
  userId: string;
  courseId: string;
  youtubeVideoId: string;
  pageId: string;
  body: string;
}): Promise<{ note: LessonNoteDocument | null; capReached: boolean }> {
  const filter = noteFilter(input.userId, input.courseId, input.youtubeVideoId);
  const now = new Date();

  const updated = await LessonNote.findOneAndUpdate(
    { ...filter, "pages.id": input.pageId },
    {
      $set: {
        "pages.$.body": input.body,
        "pages.$.updatedAt": now,
        updatedAt: now,
      },
    },
    { new: true },
  ).exec();
  if (updated) {
    return { note: updated, capReached: false };
  }

  await LessonNote.updateOne(
    filter,
    {
      $setOnInsert: {
        user: filter.user,
        course: filter.course,
        youtubeVideoId: filter.youtubeVideoId,
        body: "",
        pages: [],
      },
    },
    { upsert: true },
  ).exec();

  const appended = await LessonNote.findOneAndUpdate(
    {
      ...filter,
      "pages.id": { $ne: input.pageId },
      [`pages.${MAX_NOTE_PAGES - 1}`]: { $exists: false },
    },
    {
      $push: {
        pages: {
          id: input.pageId,
          body: input.body,
          notionPageId: null,
          lastSyncedAt: null,
          lastSyncedHash: null,
          updatedAt: now,
        },
      },
      $set: { updatedAt: now },
    },
    { new: true },
  ).exec();
  if (appended) {
    return { note: appended, capReached: false };
  }

  const current = await LessonNote.findOne(filter).exec();
  return {
    note: current,
    capReached: (current?.pages.length ?? 0) >= MAX_NOTE_PAGES,
  };
}

export async function deleteNotePage(input: {
  userId: string;
  courseId: string;
  youtubeVideoId: string;
  pageId: string;
}) {
  return LessonNote.findOneAndUpdate(
    noteFilter(input.userId, input.courseId, input.youtubeVideoId),
    {
      $pull: { pages: { id: input.pageId } },
      $set: { updatedAt: new Date() },
    },
    { new: true },
  ).exec();
}

export async function setNotePageNotionPage(input: {
  userId: string;
  courseId: string;
  youtubeVideoId: string;
  pageId: string;
  notionPageId: string;
  lastSyncedHash: string;
}) {
  const now = new Date();
  return LessonNote.findOneAndUpdate(
    {
      ...noteFilter(input.userId, input.courseId, input.youtubeVideoId),
      "pages.id": input.pageId,
    },
    {
      $set: {
        "pages.$.notionPageId": input.notionPageId,
        "pages.$.lastSyncedAt": now,
        "pages.$.lastSyncedHash": input.lastSyncedHash,
        updatedAt: now,
      },
    },
    { new: true },
  ).exec();
}
