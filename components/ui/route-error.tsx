"use client";

import { Button } from "@/components/ui/button";

export function RouteError({
  title,
  retry,
}: {
  title: string;
  retry?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Please try again. If this keeps happening, refresh the page.
      </p>
      {retry ? (
        <Button className="mt-6" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
