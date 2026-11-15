import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db/connect";
import { countUsers } from "@/repositories/user.repository";
import {
  countEnrollments,
  sumCreditedWatchSeconds,
} from "@/repositories/enrollment.repository";

export type SiteStats = {
  learners: number;
  coursesTracked: number;
  hoursWatched: number;
};

// The landing page renders on every request, so the counts are cached for an
// hour instead of hitting three collections for each visitor and crawler.
const loadSiteStats = unstable_cache(
  async (): Promise<SiteStats> => {
    await connectDb();
    const [learners, coursesTracked, watchSeconds] = await Promise.all([
      countUsers(),
      countEnrollments(),
      sumCreditedWatchSeconds(),
    ]);
    return {
      learners,
      coursesTracked,
      hoursWatched: Math.floor(watchSeconds / 3600),
    };
  },
  ["site-stats"],
  { revalidate: 3600 },
);

/** Live counts for the landing page, or null when the database is unreachable. */
export async function getSiteStats(): Promise<SiteStats | null> {
  try {
    return await loadSiteStats();
  } catch {
    return null;
  }
}
