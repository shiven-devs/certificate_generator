import { cache } from "react";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { canWriteBlog } from "@/lib/blog/author";
import { slugifyTitle } from "@/lib/blog/slug";
import { resolveSession, requireUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { userHasGoogleIdentity, type PublicUser } from "@/repositories/user.repository";
import { isDuplicateKeyError } from "@/repositories/course.repository";
import {
  createBlogPost,
  deleteBlogPost,
  findBlogPostById,
  findBlogPostBySlug,
  listBlogPosts,
  updateBlogPost,
  type BlogPostRecord,
  type BlogPostWrite,
} from "@/repositories/blog-post.repository";
import {
  blogPostIdParamSchema,
  blogPostInputSchema,
  type BlogPostInput,
} from "@/schemas/blog.schema";

export type BlogViewer = {
  user: PublicUser | null;
  canWrite: boolean;
};

async function isBlogAuthor(user: PublicUser): Promise<boolean> {
  return canWriteBlog({
    email: user.email,
    hasGoogleIdentity: await userHasGoogleIdentity(user.id),
  });
}

/** Who is looking at a blog page. Cached so layout and page share one lookup. */
export const getBlogViewer = cache(async (): Promise<BlogViewer> => {
  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return { user: null, canWrite: false };
  }
  return { user: session.user, canWrite: await isBlogAuthor(session.user) };
});

/** For write API routes: signed in and on the author list, or a 403. */
export async function requireBlogAuthor(): Promise<PublicUser> {
  const user = await requireUser();
  await connectDb();
  if (!(await isBlogAuthor(user))) {
    throw new AppError(ErrorCodes.FORBIDDEN, "You don't have permission to write on the blog.", 403);
  }
  return user;
}

export async function listPostsForViewer(viewer: BlogViewer): Promise<BlogPostRecord[]> {
  await connectDb();
  return listBlogPosts({ includeDrafts: viewer.canWrite });
}

/** Published posts for everyone; drafts only for the author. */
export async function getPostForViewer(
  slug: string,
  viewer: BlogViewer,
): Promise<BlogPostRecord | null> {
  await connectDb();
  const post = await findBlogPostBySlug(slug);
  if (!post || (post.status !== "published" && !viewer.canWrite)) {
    return null;
  }
  return post;
}

function toWrite(input: BlogPostInput, existing: BlogPostRecord | null): BlogPostWrite {
  const parsed = blogPostInputSchema.parse(input);
  const slug = parsed.slug || slugifyTitle(parsed.title);
  if (!slug) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      "Add a URL slug: the title has no letters or numbers to build one from.",
      400,
    );
  }

  const now = new Date();
  const publishedAt =
    parsed.status === "published" ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null);

  return {
    slug,
    title: parsed.title,
    description: parsed.description,
    content: parsed.content,
    coverImageUrl: parsed.coverImageUrl || null,
    tags: [...new Set(parsed.tags)],
    status: parsed.status,
    publishedAt,
    updatedAt: now,
  };
}

function slugTaken(): AppError {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    "Another post already uses this URL. Choose a different slug.",
    409,
  );
}

export async function createPost(author: PublicUser, input: BlogPostInput): Promise<BlogPostRecord> {
  const write = toWrite(input, null);
  try {
    return await createBlogPost({ ...write, authorId: author.id, authorName: author.name });
  } catch (error) {
    if (isDuplicateKeyError(error)) throw slugTaken();
    throw error;
  }
}

function parsePostId(postId: string): string {
  const parsed = blogPostIdParamSchema.safeParse({ postId });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Post not found.", 404);
  }
  return parsed.data.postId;
}

export async function updatePost(postId: string, input: BlogPostInput): Promise<BlogPostRecord> {
  const id = parsePostId(postId);
  const existing = await findBlogPostById(id);
  if (!existing) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Post not found.", 404);
  }

  try {
    const updated = await updateBlogPost(id, toWrite(input, existing));
    if (!updated) throw new AppError(ErrorCodes.NOT_FOUND, "Post not found.", 404);
    return updated;
  } catch (error) {
    if (isDuplicateKeyError(error)) throw slugTaken();
    throw error;
  }
}

export async function removePost(postId: string): Promise<void> {
  if (!(await deleteBlogPost(parsePostId(postId)))) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Post not found.", 404);
  }
}
