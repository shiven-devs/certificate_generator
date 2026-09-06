export default function AppLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
      <div className="mt-8 h-40 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
