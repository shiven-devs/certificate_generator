import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/support";
import { SITE_NAME } from "@/lib/seo/site";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-slate-900 dark:hover:text-slate-100">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-1 sm:items-end">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
          >
            {SUPPORT_EMAIL}
          </a>
          <p>© 2026 {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
