import { Types } from "mongoose";
import { BlogPost, type BlogPostDocument } from "@/models/blog-post.model";

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  status: "draft" | "published";
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostWrite = {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date;
};

function toRecord(doc: BlogPostDocument): BlogPostRecord {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? "",
    content: doc.content,
    coverImageUrl: doc.coverImageUrl ?? null,
    tags: doc.tags ?? [],
    status: doc.status as "draft" | "published",
    authorName: doc.authorName,
    publishedAt: doc.publishedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  const doc = await BlogPost.findOne({ slug }).lean<BlogPostDocument>().exec();
  return doc ? toRecord(doc) : null;
}

export async function findBlogPostById(id: string): Promise<BlogPostRecord | null> {
  const doc = await BlogPost.findById(id).lean<BlogPostDocument>().exec();
  return doc ? toRecord(doc) : null;
}

/** Newest first. Drafts are included only when asked for (the author's view). */
export async function listBlogPosts(options: {
  includeDrafts: boolean;
  limit?: number;
}): Promise<BlogPostRecord[]> {
  const filter = options.includeDrafts ? {} : { status: "published" as const };
  const docs = await BlogPost.find(filter)
    .sort({ publishedAt: -1, updatedAt: -1 })
    .limit(options.limit ?? 200)
    .lean<BlogPostDocument[]>()
    .exec();
  return docs.map(toRecord);
}

export async function createBlogPost(
  input: BlogPostWrite & { authorId: string; authorName: string },
): Promise<BlogPostRecord> {
  const doc = await BlogPost.create({
    ...input,
    author: new Types.ObjectId(input.authorId),
    createdAt: input.updatedAt,
  });
  return toRecord(doc.toObject() as BlogPostDocument);
}

export async function updateBlogPost(
  id: string,
  input: BlogPostWrite,
): Promise<BlogPostRecord | null> {
  const doc = await BlogPost.findByIdAndUpdate(id, { $set: input }, { new: true })
    .lean<BlogPostDocument>()
    .exec();
  return doc ? toRecord(doc) : null;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const result = await BlogPost.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  return result.deletedCount === 1;
}

export async function listPublishedBlogSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return BlogPost.find({ status: "published" })
    .select("slug updatedAt -_id")
    .sort({ publishedAt: -1 })
    .limit(5000)
    .lean<{ slug: string; updatedAt: Date }[]>()
    .exec();
}
