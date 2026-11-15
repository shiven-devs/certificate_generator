"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { renderBlogMarkdown } from "@/lib/blog/markdown";
import { slugifyTitle } from "@/lib/blog/slug";

export type BlogEditorPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  status: "draft" | "published";
};

type SavedPost = { id: string; slug: string; status: "draft" | "published" };

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "text-sm font-medium text-slate-800 dark:text-slate-200";

export function BlogEditor({ post }: { post: BlogEditorPost | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [description, setDescription] = useState(post?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugEdited ? slug : slugifyTitle(title);
  const previewHtml = useMemo(
    () => (tab === "preview" ? renderBlogMarkdown(content) : ""),
    [tab, content],
  );

  async function save(status: "draft" | "published") {
    setBusy(true);
    setError(null);
    const response = await apiRequest<SavedPost>(post ? `/api/blog/${post.id}` : "/api/blog", {
      method: post ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: effectiveSlug,
        description,
        coverImageUrl,
        content,
        status,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    setBusy(false);

    if (!response.ok) {
      setError(response.error.message);
      return;
    }
    router.push(`/blog/${response.data.slug}`);
    router.refresh();
  }

  async function remove() {
    if (!post || !window.confirm("Delete this post permanently? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const response = await apiRequest<{ deleted: boolean }>(`/api/blog/${post.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error.message);
      return;
    }
    router.push("/blog");
    router.refresh();
  }

  const isPublished = post?.status === "published";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save("published");
      }}
    >
      <div className="space-y-2">
        <label htmlFor="blog-title" className={labelClass}>
          Title
        </label>
        <input
          id="blog-title"
          className={`${fieldClass} text-lg font-semibold`}
          value={title}
          maxLength={140}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-slug" className={labelClass}>
          URL
        </label>
        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="shrink-0">/blog/</span>
          <input
            id="blog-slug"
            className={fieldClass}
            value={effectiveSlug}
            maxLength={100}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value.toLowerCase());
            }}
          />
        </div>
        {isPublished ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Changing the URL of a published post breaks links already shared to it.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-description" className={labelClass}>
          Summary <span className="font-normal text-slate-500">(shown in lists and search results)</span>
        </label>
        <textarea
          id="blog-description"
          className={fieldClass}
          rows={2}
          maxLength={300}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-cover" className={labelClass}>
            Cover image URL <span className="font-normal text-slate-500">(optional, https)</span>
          </label>
          <input
            id="blog-cover"
            type="url"
            className={fieldClass}
            placeholder="https://…"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="blog-tags" className={labelClass}>
            Tags <span className="font-normal text-slate-500">(comma separated, up to 6)</span>
          </label>
          <input
            id="blog-tags"
            className={fieldClass}
            placeholder="study habits, youtube"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className={labelClass}>Content</span>
          <div role="tablist" className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {(["write", "preview"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                  tab === value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {tab === "write" ? (
          <>
            <textarea
              aria-label="Content in Markdown"
              className={`${fieldClass} min-h-[420px] font-mono leading-6`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>,{" "}
              <code>[link](https://…)</code>, <code>![alt](https://…)</code>, <code>- list</code>,{" "}
              <code>```code```</code>, <code>&gt; quote</code>.
            </p>
          </>
        ) : (
          <div
            className="blog-prose min-h-[420px] rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            dangerouslySetInnerHTML={{
              __html: previewHtml || "<p><em>Nothing to preview yet.</em></p>",
            }}
          />
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPublished ? "Update post" : "Publish"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save("draft")}
          className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {isPublished ? "Unpublish (back to draft)" : "Save draft"}
        </button>
        {post ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="ml-auto inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
