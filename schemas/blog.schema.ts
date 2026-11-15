import { z } from "zod";
import { BLOG_SLUG_MAX, isValidBlogSlug } from "@/lib/blog/slug";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(3, "Add a title of at least 3 characters.").max(140),
  slug: z
    .string()
    .trim()
    .max(BLOG_SLUG_MAX)
    .refine((value) => value === "" || isValidBlogSlug(value), {
      message: "Use lowercase letters, numbers, and single hyphens for the URL.",
    })
    .optional()
    .default(""),
  description: optionalText(300),
  content: z.string().min(1, "Write something before saving.").max(100_000),
  coverImageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value), {
      message: "The cover image must be an https:// URL.",
    })
    .optional()
    .default(""),
  tags: z.array(z.string().trim().min(1).max(30)).max(6).optional().default([]),
  status: z.enum(["draft", "published"]),
});

export type BlogPostInput = z.input<typeof blogPostInputSchema>;
export type BlogPostParsed = z.output<typeof blogPostInputSchema>;

export const blogPostIdParamSchema = z.object({
  postId: z.string().regex(/^[a-f0-9]{24}$/i),
});
