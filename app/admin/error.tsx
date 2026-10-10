"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Could not load certificate requests" retry={reset} />;
}
