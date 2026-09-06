"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AppError({
  retry,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
}) {
  return <RouteError title="Something went wrong" retry={retry} />;
}
