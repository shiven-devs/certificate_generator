import { SUPPORT_EMAIL } from "@/lib/support";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-slate-600 sm:px-6 dark:text-slate-400">
        <p>
          Questions or issues? Email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-indigo-700 underline dark:text-indigo-400"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
