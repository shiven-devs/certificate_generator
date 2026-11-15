import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { getBlogViewer } from "@/services/blog.service";

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const viewer = await getBlogViewer();

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <MarketingHeader signedIn={viewer.user !== null} />
      {children}
    </div>
  );
}
