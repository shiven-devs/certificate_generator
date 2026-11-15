import type { FaqEntry } from "@/lib/marketing/faq";

/** Native disclosure widgets: answers stay in the server HTML for crawlers. */
export function FaqList({ items }: { items: readonly FaqEntry[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
            <h3>{item.question}</h3>
            <span
              aria-hidden="true"
              className="text-xl leading-none text-slate-400 transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
