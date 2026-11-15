import { ImageResponse } from "next/og";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/site";

// No request data, so this renders once at build time and is served statically.
export const dynamic = "force-static";

const LEVEL_COLOR = ["#1e293b", "#0e4429", "#006d32", "#26a641", "#39d353"] as const;

function sampleLevel(week: number, day: number): number {
  const seed = ((week * 7 + day) * 2654435761) >>> 0;
  const noise = (seed % 100) / 100;
  const ramp = week / 26;
  if (noise > 0.35 + ramp * 0.5) return 0;
  return Math.min(4, 1 + Math.floor(noise * 4 * (0.6 + ramp)));
}

export function GET() {
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
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>CertiTube</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            Turn YouTube into a learning habit you can prove.
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 28, color: "#cbd5e1" }}>
            Watch-time tracking · Daily streaks · Public learner profile
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 26 }, (_, week) => (
              <div key={week} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Array.from({ length: 7 }, (_, day) => (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      backgroundColor: LEVEL_COLOR[sampleLevel(week, day)],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#a5b4fc" }}>
            certitube.vercel.app · Free
          </div>
        </div>
      </div>
    ),
    { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
  );
}
