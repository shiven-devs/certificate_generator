"use client";

import { useEffect } from "react";

export function SessionKickNotice() {
  useEffect(() => {
    void fetch("/api/auth/logout", { method: "POST" });
  }, []);

  return (
    <p
      className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      You were logged out because your account was used on another device.
    </p>
  );
}
