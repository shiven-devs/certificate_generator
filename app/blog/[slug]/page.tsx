import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPostDate } from "@/lib/blog/format";
import { readingMinutes, renderBlogMarkdown } from "@/lib/blog/markdown";
import {
  DEFAULT_OG_IMAGE,
  FOUNDER,
  SITE_NAME,
  absoluteUrl,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";
import { getBlogViewer, getPostForViewer } from "@/services/blog.service";

type Props = { params: Promise<{ slug: string }> };

// Metadata and the page body render in the same request, so one read serves both.
const loadPost = cache(async (slug: string) => getPostForViewer(slug, await getBlogViewer()));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  const title = `${post.title} – ${SITE_NAME} Blog`;
  const description = post.description || `${post.title}, on the ${SITE_NAME} blog.`;
  const path = `/blog/${post.slug}`;
  const images = post.coverImageUrl ? [{ url: post.coverImageUrl }] : [DEFAULT_OG_IMAGE];

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    // Drafts are visible to the author only and must never be indexed.
    robots: post.status === "published" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images,
      authors: [post.authorName],
      tags: post.tags,
      ...(post.publishedAt ? { publishedTime: post.publishedAt.toISOString() } : {}),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getBlogViewer();
  const post = await loadPost(slug);
  if (!post) {
    notFound();
  }

  const url = absoluteUrl(`/blog/${post.slug}`);
  const published = formatPostDate(post.publishedAt);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.description ? { description: post.description } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.coverImageUrl ?? absoluteUrl(DEFAULT_OG_IMAGE.url),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    author: {
      "@type": "Person",
      name: post.authorName,
      ...(post.authorName === FOUNDER.name
        ? { url: absoluteUrl("/about"), sameAs: [FOUNDER.githubUrl] }
        : {}),
    },
    publisher: organizationJsonLd(),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {post.status === "published" ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/blog"
          className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
        >
          ← All posts
        </Link>
        {viewer.canWrite ? (
          <Link
            href={`/blog/${post.slug}/edit`}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Edit post
          </Link>
        ) : null}
      </div>

      {post.status === "draft" ? (
        <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          This is a draft. Only you can see it until you publish it.
        </p>
      ) : null}

      <article className="mt-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-slate-50">
            {post.title}
          </h1>
          {post.description ? (
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
              {post.description}
            </p>
          ) : null}
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{post.authorName}</span>
            {published && post.publishedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt.toISOString()}>{published}</time>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(post.content)} min read</span>
          </p>
        </header>

        {post.coverImageUrl ? (
          // Cover images are arbitrary https URLs, so next/image's host allowlist doesn't fit.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="mt-8 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-800"
          />
        ) : null}

        <div
          className="blog-prose mt-10"
          dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(post.content) }}
        />

        {post.tags.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-slate-800">
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

      <aside className="mt-12 rounded-2xl bg-indigo-600 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-white">
          Turn YouTube into a learning habit you can prove.
        </p>
        <Link
          href={viewer.user ? "/dashboard" : "/signup"}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        >
          {viewer.user ? "Go to dashboard →" : "Start for free"}
        </Link>
      </aside>
    </main>
  );
}
