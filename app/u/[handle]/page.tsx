import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db/connect";
import { createMemoryRateLimiter } from "@/lib/rate-limit/memory";
import { profileShareDescription } from "@/lib/profile/share-text";
import {
  OG_CARD_ALT,
  OG_CARD_SIZE,
  profileCardImagePath,
} from "@/lib/profile/og-card";
import { getPublicProfile } from "@/services/profile.service";
import { PublicProfileView } from "@/components/profile/public-profile-view";

export const dynamic = "force-dynamic";

const limiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
});

// Metadata and the page body render in the same request, so one read serves both.
const loadProfile = cache(async (handle: string) => {
  await connectDb();
  return getPublicProfile(handle);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await loadProfile(handle);
  if (!profile) {
    return { title: "Profile not found", robots: { index: false, follow: false } };
  }

  const title = `${profile.profile.name} on Certitube`;
  const description = profileShareDescription(profile.profile);
  const url = `/u/${profile.profile.handle}`;
  const images = [
    {
      url: profileCardImagePath(profile.profile.handle),
      width: OG_CARD_SIZE.width,
      height: OG_CARD_SIZE.height,
      alt: OG_CARD_ALT,
      type: "image/png",
    },
  ];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      // LinkedIn only reads "website" and "article" reliably.
      type: "website",
      siteName: "Certitube",
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  if (!limiter.consume(`profile-view:${ip}`).allowed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Please wait
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Too many profile lookups from this network. Try again in a few minutes.
        </p>
      </div>
    );
  }

  const profile = await loadProfile(handle);
  if (!profile) {
    notFound();
  }

  return <PublicProfileView {...profile} />;
}
