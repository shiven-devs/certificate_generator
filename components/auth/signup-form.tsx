"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PASSWORD_RULES } from "@/lib/auth/password-policy";
import { signupSchema } from "@/schemas/auth.schema";

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [password, setPassword] = useState("");

  async function onSubmit(formData: FormData) {
    setFormError(null);
    setFieldErrors({});

    const parsed = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "email" || key === "password") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: { message: string };
      };

      if (!response.ok || !payload.success) {
        setFormError(payload.error?.message ?? "Could not create your account.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? <GoogleSignInButton /> : null}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <Input
          name="name"
          label="Full name"
          autoComplete="name"
          required
          error={fieldErrors.name}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          aria-describedby="password-requirements"
        />
        <ul
          id="password-requirements"
          className="space-y-1 text-sm"
          aria-label="Password requirements"
        >
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.id}
                className={
                  met
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400"
                }
              >
                <span className="sr-only">{met ? "Met: " : "Not met: "}</span>
                {met ? "✓" : "•"} {rule.label}
              </li>
            );
          })}
        </ul>
        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
