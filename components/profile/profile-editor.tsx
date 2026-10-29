"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { useSessionErrorRedirect } from "@/hooks/use-session-error-redirect";
import { Button } from "@/components/ui/button";
import type { MyProfile } from "@/services/profile.service";
import { ProfileCourseCard } from "@/components/profile/profile-course-card";

export function ProfileEditor({
  initial,
  profileUrl,
}: {
  initial: MyProfile;
  profileUrl: string;
}) {
  const redirectOnSessionError = useSessionErrorRedirect();
  const [profile, setProfile] = useState(initial);
  const [headline, setHeadline] = useState(initial.profile.headline ?? "");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function save(key: string, body: Record<string, unknown>, path: string) {
    setPendingKey(key);
    setError(null);
    const response = await apiRequest<MyProfile>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPendingKey(null);

    if (!response.ok) {
      if (redirectOnSessionError(response.error)) {
        return;
      }
      setError(response.error.message);
      return;
    }

    setProfile(response.data);
    setHeadline(response.data.profile.headline ?? "");
  }

  function patchProfile(key: string, body: Record<string, unknown>) {
    return save(key, body, "/api/profile");
  }

  function setCourseVisible(enrollmentId: string, visible: boolean) {
    return save(
      enrollmentId,
      { visible },
      `/api/profile/courses/${enrollmentId}`,
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying failed. Select the link and copy it manually.");
    }
  }

  const visibleCount = profile.courses.filter((course) => course.visible).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Your profile link
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Anyone with this link can see your consistency and the lectures you have
          completed.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {profileUrl}
          </code>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Link
              href={`/u/${profile.profile.handle}`}
              target="_blank"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Profile details
        </h2>
        <label
          htmlFor="profile-headline"
          className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Headline
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id="profile-headline"
            value={headline}
            maxLength={120}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="What you are learning right now"
            className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <Button
            onClick={() => patchProfile("headline", { headline })}
            disabled={
              pendingKey === "headline" ||
              headline === (profile.profile.headline ?? "")
            }
          >
            {pendingKey === "headline" ? "Saving…" : "Save"}
          </Button>
        </div>

        <div className="mt-6 flex items-start justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Show consistency heatmap
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Your streaks and daily watch time appear on the profile page.
            </p>
          </div>
          <Button
            variant="secondary"
            aria-pressed={profile.profile.showHeatmap}
            disabled={pendingKey === "heatmap"}
            onClick={() =>
              patchProfile("heatmap", { showHeatmap: !profile.profile.showHeatmap })
            }
          >
            {pendingKey === "heatmap"
              ? "Saving…"
              : profile.profile.showHeatmap
                ? "Shown"
                : "Hidden"}
          </Button>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <section>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Courses on your profile
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {visibleCount} of {profile.courses.length} shown
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          A lecture appears once at least 75% of it is credited. Hiding a course keeps
          your progress, it only takes the course off your public page.
        </p>
        {profile.courses.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">
              Nothing to show yet
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Finish a lecture and it will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.courses.map((course) => (
              <ProfileCourseCard
                key={course.enrollmentId}
                course={course}
                dimmed={!course.visible}
                action={
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={pendingKey === course.enrollmentId}
                    onClick={() =>
                      setCourseVisible(course.enrollmentId, !course.visible)
                    }
                  >
                    {pendingKey === course.enrollmentId
                      ? "Saving…"
                      : course.visible
                        ? "Remove from profile"
                        : "Add back to profile"}
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
