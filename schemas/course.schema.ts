import { z } from "zod";

export const resolveCourseQuerySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a YouTube URL.")
    .max(2048, "That URL is too long."),
});

export const createCourseSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a YouTube URL.")
    .max(2048, "That URL is too long."),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid course."),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
