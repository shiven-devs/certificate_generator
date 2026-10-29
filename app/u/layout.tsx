import type { ReactNode } from "react";
import { resolveSession } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const session = await resolveSession();
  const user = session.status === "authenticated" ? session.user : null;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader user={user} />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
