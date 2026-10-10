"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ALREADY_LOGGED_IN_ANOTHER_TAB, holdAuthTabLock } from "@/lib/auth/tab-lock";

type TabLockStatus = "pending" | "owner" | "blocked";

export function SingleTabGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<TabLockStatus>("owner");

  useEffect(() => holdAuthTabLock(setStatus), []);

  if (status === "blocked") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Already signed in
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400" role="status">
          {ALREADY_LOGGED_IN_ANOTHER_TAB}
        </p>
      </div>
    );
  }

  if (status !== "owner") {
    return (
      <div className="flex-1" aria-busy="true" aria-live="polite">
        <p className="sr-only">Checking this tab</p>
      </div>
    );
  }

  return children;
}
