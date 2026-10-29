import Link from "next/link";
import type { PublicUser } from "@/repositories/user.repository";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CheckInStreakBadge } from "@/components/activity/check-in-streak-badge";
import { certificatesEnabled } from "@/lib/config/features";

export function SiteHeader({ user }: { user: PublicUser | null }) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Certitube
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Courses
              </Link>
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Profile
              </Link>
              {certificatesEnabled() ? (
                <Link
                  href="/certificates"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Certificates
                </Link>
              ) : null}
              <CheckInStreakBadge />
              <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-400">
                {user.name}
              </span>
              <ThemeToggle />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <ThemeToggle />
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
