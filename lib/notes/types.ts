export type PublicLessonNote = {
  courseId: string;
  youtubeVideoId: string;
  body: string;
  notionPageId: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
};
