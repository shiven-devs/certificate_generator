import { ImageResponse } from "next/og";
import { connectDb } from "@/lib/db/connect";
import { heatmapStripWeeks } from "@/lib/profile/og-heatmap";
import { getPublicProfile } from "@/services/profile.service";

export const alt = "Certitube learner profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Rendering the card takes a few seconds, and social crawlers give up long
// before that, so the PNG is cached and refreshed in the background instead.
export const revalidate = 3600;

const CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=604800";

const LEVEL_COLOR = [
  "#1e293b",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const;

export default async function ProfileOgImage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  await connectDb();
  const profile = await getPublicProfile(handle).catch(() => null);

  const name = profile?.profile.name ?? "Certitube";
  const subtitle = profile ? `@${profile.profile.handle}` : "certitube.vercel.app";
  const headline =
    profile?.profile.headline ??
    "Consistent study, credited lecture by lecture.";
  const weeks = profile?.activity
    ? heatmapStripWeeks(profile.activity.months)
    : [];

  const stats = profile
    ? [
        { label: "Courses", value: String(profile.profile.completedCourseCount) },
        { label: "Lectures", value: String(profile.profile.completedLessonCount) },
        { label: "Streak", value: `${profile.profile.currentStreak}d` },
        { label: "Longest", value: `${profile.profile.longestStreak}d` },
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          backgroundColor: "#020617",
          backgroundImage:
            "radial-gradient(900px circle at 85% 0%, #1e1b4b 0%, #020617 60%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#4f46e5",
            }}
          />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>
            Certitube
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 22 ? 64 : 76,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </div>
          <div
            style={{ display: "flex", marginTop: 10, fontSize: 30, color: "#a5b4fc" }}
          >
            {subtitle}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: 28,
              color: "#cbd5e1",
              maxWidth: 900,
            }}
          >
            {headline.length > 90 ? `${headline.slice(0, 87)}…` : headline}
          </div>
        </div>

        {weeks.length > 0 ? (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                {week.map((level, dayIndex) => (
                  <div
                    key={dayIndex}
                    style={{
                      display: "flex",
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: LEVEL_COLOR[level],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 56 }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
                  {stat.value}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 4,
                    fontSize: 22,
                    color: "#94a3b8",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              fontSize: 22,
              color: "#64748b",
            }}
          >
            Completed lectures &amp; study consistency
          </div>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
