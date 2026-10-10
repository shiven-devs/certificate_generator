"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function logout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="secondary" disabled={isSubmitting} onClick={() => void logout()}>
      {isSubmitting ? "Signing out…" : "Sign out"}
    </Button>
  );
}
