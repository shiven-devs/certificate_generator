export default function AdminLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <p className="sr-only">Loading certificate requests</p>
      <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
      <div className="mt-8 h-40 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </main>
  );
}
