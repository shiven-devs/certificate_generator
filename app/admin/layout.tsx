import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">{children}</div>;
}
