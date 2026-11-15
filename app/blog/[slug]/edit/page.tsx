import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/blog/blog-editor";
import { getBlogViewer, getPostForViewer } from "@/services/blog.service";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const viewer = await getBlogViewer();
  if (!viewer.canWrite) {
    notFound();
  }

  const { slug } = await params;
  const post = await getPostForViewer(slug, viewer);
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        Edit post
      </h1>
      <BlogEditor
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          tags: post.tags,
          status: post.status,
        }}
      />
    </main>
  );
}
