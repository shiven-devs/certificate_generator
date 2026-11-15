import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/blog/blog-editor";
import { getBlogViewer } from "@/services/blog.service";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewBlogPostPage() {
  // Readers get a plain 404, so the editor's existence isn't advertised.
  if (!(await getBlogViewer()).canWrite) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        New post
      </h1>
      <BlogEditor post={null} />
    </main>
  );
}
