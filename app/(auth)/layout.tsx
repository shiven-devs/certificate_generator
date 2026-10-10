import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-4 flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}
