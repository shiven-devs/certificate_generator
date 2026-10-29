import { ImageResponse } from "next/og";
import { connectDb } from "@/lib/db/connect";
import { OG_CARD_SIZE } from "@/lib/profile/og-card";
import { heatmapStripWeeks } from "@/lib/profile/og-heatmap";
import { getProfileCardData } from "@/services/profile.service";

export const runtime = "nodejs";

// Next rewrites Cache-Control on its built-in metadata image routes, so the
// card lives in a route handler where these headers survive to the CDN. The
// week of stale-while-revalidate means a crawler is never the request that
// waits for a re-render.
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=604800";

const LEVEL_COLOR = [
  "#1e293b",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle } = await context.params;
  await connectDb();
  const card = await getProfileCardData(handle).catch(() => null);

  const name = card?.name ?? "Certitube";
  const subtitle = card ? `@${card.handle}` : "certitube.vercel.app";
  const headline =
    card?.headline ?? "Consistent study, credited lecture by lecture.";
  const weeks = card?.activity ? heatmapStripWeeks(card.activity.months) : [];
  const stats = card
    ? [
        { label: "Courses", value: String(card.completedCourseCount) },
        { label: "Lectures", value: String(card.completedLessonCount) },
        { label: "Streak", value: `${card.currentStreak}d` },
        { label: "Longest", value: `${card.longestStreak}d` },
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
    {
      ...OG_CARD_SIZE,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
      },
    },
  );
}
