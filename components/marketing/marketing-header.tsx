import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SITE_NAME } from "@/lib/seo/site";

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
          >
            How it works
          </Link>
          {signedIn ? null : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Log in
            </Link>
          )}
          <ThemeToggle />
          <Link
            href={signedIn ? "/dashboard" : "/signup"}
            className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {signedIn ? "Go to dashboard →" : "Start for free"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
