"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearCheckInToastState } from "@/lib/activity/daily-check-in-client";
import { resetDailyCheckInRequestCache } from "@/components/activity/daily-check-in";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onLogout() {
    setIsSubmitting(true);
    try {
      clearCheckInToastState();
      resetDailyCheckInRequestCache();
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void onLogout()} disabled={isSubmitting}>
      {isSubmitting ? "Signing out…" : "Sign out"}
    </Button>
  );
}
