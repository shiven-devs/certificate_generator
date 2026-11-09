export type PublicNotePage = {
  id: string;
  body: string;
  notionPageId: string | null;
  lastSyncedAt: string | null;
};

export type PublicLessonNote = {
  courseId: string;
  youtubeVideoId: string;
  pages: PublicNotePage[];
  updatedAt: string;
};
