import Link from "next/link";
import type { Metadata } from "next";
import { resolveSession } from "@/lib/auth/session";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  SITE_NAME,
  absoluteUrl,
  marketingMetadata,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = marketingMetadata({
  title: "How CertiTube Works – Track YouTube Learning Step by Step",
  description:
    "See how CertiTube turns a YouTube video or playlist into a tracked course: watch-time crediting, exact-timestamp resume, daily streaks, a consistency heatmap, notes, and a public profile.",
  path: "/how-it-works",
});

const SECTIONS = [
  {
    id: "create-a-course",
    title: "1. Paste a YouTube video or playlist URL",
    points: [
      "Paste a link to any YouTube lecture, tutorial, or educational playlist.",
      "CertiTube shows a preview of the course and its lessons before you enroll.",
      "A single video becomes a one-lesson course. A playlist becomes a multi-lesson course with one lesson per video, up to 200 videos.",
    ],
  },
  {
    id: "watch-and-get-credit",
    title: "2. Watch and get credit for real watch time",
    points: [
      "Lessons play in an embedded YouTube player inside CertiTube.",
      "CertiTube credits the percentage of each video you actually watched, so skipping ahead does not count.",
      "A lesson is marked completed once you reach 75% credited watch time.",
      "Close the tab any time: the lesson resumes at your exact last timestamp.",
      "Set playback speed from 0.5x to 1.5x, or switch to fullscreen to focus.",
    ],
  },
  {
    id: "track-playlists",
    title: "3. Track every lesson in a playlist",
    points: [
      "Each lesson in a playlist course shows its own status, so you always know what is left.",
      "Watch lessons in any order. Course progress adds up from the lessons you complete.",
    ],
  },
  {
    id: "streak-and-heatmap",
    title: "4. Build a daily streak and a consistency heatmap",
    points: [
      "Every day you open CertiTube while signed in counts as a daily check-in and grows your streak.",
      "Your dashboard shows your current streak and your longest streak.",
      "A GitHub-style heatmap shows your credited watch time for each day over the past year, with your active days and total hours.",
    ],
  },
  {
    id: "notes",
    title: "5. Take notes beside the video",
    points: [
      "Every lesson has a rich-text notes editor with bold, italic, underline, and H1 to H4 headings.",
      "Connect Notion and sync your lesson notes there with one click.",
    ],
  },
  {
    id: "public-profile",
    title: "6. Share your public learner profile",
    points: [
      "Your profile lives at certitube.vercel.app/u/your-username.",
      "It shows your headline, courses completed, lectures completed, current and longest streak, and your completed courses.",
      "You choose what appears: hide the heatmap or remove any course you would rather not show.",
      "Share the link on your resume, LinkedIn, or with recruiters as proof of self-learning.",
    ],
  },
] as const;

// No visible FAQ on this page, so no FAQPage: a WebPage with its publisher
// and breadcrumb only.
function howItWorksJsonLd() {
  const url = absoluteUrl("/how-it-works");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: "How CertiTube works",
        description:
          "How CertiTube turns a YouTube video or playlist into a tracked course, credits watch time, builds a daily streak and heatmap, and creates a public learner profile.",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
        publisher: organizationJsonLd(),
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "How it works", item: url },
        ],
      },
    ],
  };
}

export default async function HowItWorksPage() {
  const session = await resolveSession();
  const signedIn = session.status === "authenticated";

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(howItWorksJsonLd()) }}
      />
      <MarketingHeader signedIn={signedIn} />

      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-slate-50">
          How CertiTube works
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
          CertiTube turns YouTube videos and playlists into personal courses. It
          credits the time you actually spend watching, keeps a daily learning
          streak, and gives you a public profile that shows what you have learned.
        </p>

        <nav aria-label="On this page" className="mt-8">
          <ul className="flex flex-wrap gap-2 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {section.title.replace(/^\d+\.\s*/, "")}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-base leading-7 text-slate-600 dark:text-slate-400"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Ready to start?
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            CertiTube is free. Paste your first course in under a minute.
          </p>
          <Link
            href={signedIn ? "/dashboard" : "/signup"}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {signedIn ? "Go to dashboard →" : "Start for free"}
          </Link>
        </div>
      </main>
    </div>
  );
}
