"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginSchema } from "@/schemas/admin.schema";

type FieldErrors = Partial<Record<"adminId" | "password", string>>;

export function AdminLoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(formData: FormData) {
    setFormError(null);
    setFieldErrors({});

    const parsed = adminLoginSchema.safeParse({
      adminId: formData.get("adminId"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "adminId" || key === "password") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: { message: string };
      };

      if (!response.ok || !payload.success) {
        setFormError(payload.error?.message ?? "Could not sign in.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      <Input
        name="adminId"
        label="Admin ID"
        autoComplete="username"
        required
        error={fieldErrors.adminId}
      />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
      />
      {formError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
