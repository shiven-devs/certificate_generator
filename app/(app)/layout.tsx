import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveSession } from "@/lib/auth/session";
import { redirectIfSessionInvalidated } from "@/lib/auth/session-redirect";
import { SiteHeader } from "@/components/layout/site-header";
import { DailyCheckIn } from "@/components/activity/daily-check-in";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await resolveSession();
  redirectIfSessionInvalidated(session);
  if (session.status !== "authenticated") {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <SiteHeader user={session.user} />
      <DailyCheckIn />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
