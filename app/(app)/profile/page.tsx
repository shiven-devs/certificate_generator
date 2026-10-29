import type { Metadata } from "next";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db/connect";
import { resolveSession } from "@/lib/auth/session";
import { publicOriginFromHeaders } from "@/lib/http/public-origin";
import { getMyProfile } from "@/services/profile.service";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return null;
  }

  await connectDb();
  const [profile, headerList] = await Promise.all([
    getMyProfile(session.user.id),
    headers(),
  ]);
  const profileUrl = `${publicOriginFromHeaders(headerList)}/u/${profile.profile.handle}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          My profile
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Share one link that shows how consistently you study and what you have
          finished.
        </p>
      </div>
      <ProfileEditor initial={profile} profileUrl={profileUrl} />
    </div>
  );
}
