import { z } from "zod";
import { PROFILE_HANDLE_MAX, PROFILE_HANDLE_MIN } from "@/lib/profile/handle";

export const profileHandleParamSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(PROFILE_HANDLE_MIN)
    .max(PROFILE_HANDLE_MAX),
});

export const profileSettingsSchema = z
  .object({
    showHeatmap: z.boolean().optional(),
    headline: z
      .string()
      .trim()
      .max(120, "Keep your headline under 120 characters.")
      .optional(),
  })
  .refine(
    (value) => value.showHeatmap !== undefined || value.headline !== undefined,
    { message: "Nothing to update." },
  );

export const profileCourseVisibilitySchema = z.object({
  visible: z.boolean(),
});

export const profileCourseParamSchema = z.object({
  enrollmentId: z.string().regex(/^[a-f\d]{24}$/i, "Course not found."),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type ProfileCourseVisibilityInput = z.infer<
  typeof profileCourseVisibilitySchema
>;
