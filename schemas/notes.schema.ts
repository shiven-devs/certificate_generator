import { z } from "zod";
import { YOUTUBE_VIDEO_ID_PATTERN } from "@/lib/youtube/url";
import { courseIdParamSchema } from "@/schemas/course.schema";

export const youtubeVideoIdSchema = z
  .string()
  .regex(YOUTUBE_VIDEO_ID_PATTERN, "Invalid lesson.");

export const lessonNoteQuerySchema = courseIdParamSchema.extend({
  youtubeVideoId: youtubeVideoIdSchema,
});

export const saveLessonNoteSchema = lessonNoteQuerySchema.extend({
  body: z
    .string()
    .max(50_000, "Notes are limited to 50,000 characters."),
});

export const syncLessonNoteSchema = saveLessonNoteSchema;

export const notionConnectQuerySchema = z.object({
  courseId: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid course.")
      .optional(),
  ),
});

export type SaveLessonNoteInput = z.infer<typeof saveLessonNoteSchema>;
