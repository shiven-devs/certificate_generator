import Link from "next/link";
import type { Metadata } from "next";
import { formatPostDate } from "@/lib/blog/format";
import { readingMinutes } from "@/lib/blog/markdown";
import {
  SITE_NAME,
  absoluteUrl,
  marketingMetadata,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";
import { getBlogViewer, listPostsForViewer } from "@/services/blog.service";
import type { BlogPostRecord } from "@/repositories/blog-post.repository";

export const metadata: Metadata = marketingMetadata({
  title: "CertiTube Blog – Learning from YouTube, Consistently",
  description:
    "Articles from CertiTube on self-learning with YouTube: building a study habit, finishing courses, and showing what you've learned.",
  path: "/blog",
});

function PostCard({ post, showStatus }: { post: BlogPostRecord; showStatus: boolean }) {
  const date = formatPostDate(post.publishedAt ?? post.updatedAt);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {showStatus && post.status === "draft" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Draft
          </span>
        ) : null}
        {date ? <time dateTime={new Date(post.publishedAt ?? post.updatedAt).toISOString()}>{date}</time> : null}
        <span aria-hidden="true">·</span>
        <span>{readingMinutes(post.content)} min read</span>
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      {post.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {post.description}
        </p>
      ) : null}
      {post.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export default async function BlogIndexPage() {
  const viewer = await getBlogViewer();
  const posts = await listPostsForViewer(viewer);
  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    url: absoluteUrl("/blog"),
    publisher: organizationJsonLd(),
    blogPost: published.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Blog</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Notes on learning
          </h1>
        </div>
        {viewer.canWrite ? (
          <Link
            href="/blog/new"
            className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Write a post
          </Link>
        ) : null}
      </div>

      {viewer.canWrite && drafts.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Your drafts (only you can see these)
          </h2>
          <div className="mt-4 space-y-4">
            {drafts.map((post) => (
              <PostCard key={post.id} post={post} showStatus />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 space-y-4">
        {published.length > 0 ? (
          published.map((post) => <PostCard key={post.id} post={post} showStatus={false} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No posts yet. Check back soon.
          </p>
        )}
      </section>
    </main>
  );
}
