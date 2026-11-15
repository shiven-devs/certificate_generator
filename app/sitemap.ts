import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/db/connect";
import { absoluteUrl } from "@/lib/seo/site";
import { listSitemapProfiles } from "@/repositories/user.repository";

// Regenerated at most hourly so new profiles appear without a redeploy.
export const revalidate = 3600;

async function profileEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDb();
    const profiles = await listSitemapProfiles();
    return profiles.map((profile) => ({
      url: absoluteUrl(`/u/${encodeURIComponent(profile.handle)}`),
      lastModified: profile.lastModified ?? undefined,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch {
    // A database outage should not take the static pages out of the sitemap.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/how-it-works"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...(await profileEntries()),
  ];
}
