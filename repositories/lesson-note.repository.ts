import { Types } from "mongoose";
import { LessonNote, type LessonNoteDocument } from "@/models/lesson-note.model";
import type { PublicLessonNote } from "@/lib/notes/types";

export type { PublicLessonNote };

export function toPublicLessonNote(note: LessonNoteDocument): PublicLessonNote {
  return {
    courseId: note.course.toString(),
    youtubeVideoId: note.youtubeVideoId,
    body: note.body,
    notionPageId: note.notionPageId ?? null,
    lastSyncedAt: note.lastSyncedAt ? note.lastSyncedAt.toISOString() : null,
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
    body: "",
    notionPageId: null,
    lastSyncedAt: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export async function findLessonNote(
  userId: string,
  courseId: string,
  youtubeVideoId: string,
) {
  return LessonNote.findOne({
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId),
    youtubeVideoId,
  }).exec();
}

export async function upsertLessonNote(input: {
  userId: string;
  courseId: string;
  youtubeVideoId: string;
  body: string;
}) {
  return LessonNote.findOneAndUpdate(
    {
      user: new Types.ObjectId(input.userId),
      course: new Types.ObjectId(input.courseId),
      youtubeVideoId: input.youtubeVideoId,
    },
    {
      $set: {
        body: input.body,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        user: new Types.ObjectId(input.userId),
        course: new Types.ObjectId(input.courseId),
        youtubeVideoId: input.youtubeVideoId,
      },
    },
    { new: true, upsert: true },
  ).exec();
}

export async function setLessonNoteNotionPage(input: {
  userId: string;
  courseId: string;
  youtubeVideoId: string;
  notionPageId: string;
  lastSyncedHash: string;
}) {
  return LessonNote.findOneAndUpdate(
    {
      user: new Types.ObjectId(input.userId),
      course: new Types.ObjectId(input.courseId),
      youtubeVideoId: input.youtubeVideoId,
    },
    {
      $set: {
        notionPageId: input.notionPageId,
        lastSyncedAt: new Date(),
        lastSyncedHash: input.lastSyncedHash,
        updatedAt: new Date(),
      },
    },
    { new: true },
  ).exec();
}
