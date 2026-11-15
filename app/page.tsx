import Link from "next/link";
import type { Metadata } from "next";
import { resolveSession } from "@/lib/auth/session";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { FaqList } from "@/components/marketing/faq-list";
import { LANDING_FAQ } from "@/lib/marketing/faq";
import { TESTIMONIALS } from "@/lib/marketing/testimonials";
import {
  SITE_NAME,
  absoluteUrl,
  marketingMetadata,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";
import { getSiteStats } from "@/services/site-stats.service";

export const metadata: Metadata = marketingMetadata({
  title: "CertiTube – Track Your YouTube Learning & Prove It",
  description:
    "Turn any YouTube video or playlist into a tracked course. CertiTube credits your watch time, builds a daily streak, and gives you a shareable public learning profile. Free.",
  path: "/",
});

const STEPS = [
  {
    title: "Paste any YouTube video or playlist URL",
    body: "CertiTube previews the lessons before you enroll, then turns them into your own course.",
  },
  {
    title: "Watch at your pace",
    body: "CertiTube credits your watch time and resumes exactly where you left off.",
  },
  {
    title: "Build a streak, take notes, and share",
    body: "Keep your daily streak going, write notes per lesson, and share your public profile.",
  },
] as const;

const FEATURES = [
  {
    icon: "🎬",
    title: "Any YouTube video or playlist → a tracked course",
    body: "A single video becomes a one-lesson course. A playlist becomes a multi-lesson course with status for every lesson.",
  },
  {
    icon: "📊",
    title: "Watch-time crediting",
    body: "CertiTube records how much of each video you actually watched and resumes at the exact timestamp. A lesson completes at 75%.",
  },
  {
    icon: "🔥",
    title: "Daily streak + consistency heatmap",
    body: "Track your current and longest streak, and see a year of credited watch time on a GitHub-style heatmap.",
  },
  {
    icon: "📝",
    title: "Rich notes per lesson, with Notion sync",
    body: "Write notes with headings, bold, italic, and underline beside the video, then sync them to Notion.",
  },
  {
    icon: "👤",
    title: "Public learner profile",
    body: "One link shows your stats, heatmap, and completed courses. Share it with recruiters as proof of self-learning.",
  },
  {
    icon: "⚡",
    title: "Custom playback speed + fullscreen",
    body: "Study at 0.5x to 1.5x speed, and switch to fullscreen when you want the rest of the page out of the way.",
  },
] as const;

const numberFormat = new Intl.NumberFormat("en-US");

function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        description:
          "CertiTube turns any YouTube video or playlist into a trackable course, crediting your watch time, building daily learning streaks with a consistency heatmap, and giving you a shareable public learning profile.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "YouTube video and playlist course creation",
          "Watch-time crediting and resume at exact timestamp",
          "Per-lesson progress tracking for playlists",
          "Daily learning streak",
          "GitHub-style consistency heatmap",
          "Rich-text notes with Notion sync",
          "Public shareable learner profile",
        ],
        creator: organizationJsonLd(),
      },
      {
        "@type": "FAQPage",
        mainEntity: LANDING_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

export default async function HomePage() {
  const [session, stats] = await Promise.all([resolveSession(), getSiteStats()]);
  const signedIn = session.status === "authenticated";

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd()) }}
      />
      <MarketingHeader signedIn={signedIn} />

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
              Free · Works with any YouTube course
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-slate-50">
              Turn YouTube into a learning habit you can prove.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
              CertiTube tracks your YouTube watch time, builds a daily learning
              streak, and gives you a public profile that shows recruiters exactly
              what you&apos;ve self-taught.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signedIn ? "/dashboard" : "/signup"}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-6 text-base font-medium text-white hover:bg-indigo-700"
              >
                {signedIn ? "Go to dashboard →" : "Start for free"}
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                See how it works
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </section>

        {/* Social proof */}
        {stats && stats.learners > 0 ? (
          <section
            aria-label="CertiTube in numbers"
            className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <dl className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 text-center sm:grid-cols-3 sm:px-6">
              {[
                { label: "learners", value: stats.learners },
                { label: "courses tracked", value: stats.coursesTracked },
                { label: "hours watched", value: stats.hoursWatched },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {numberFormat.format(stat.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href="/how-it-works"
            className="mt-6 inline-block text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
          >
            Read the full walkthrough →
          </Link>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Everything you need to finish what you start
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span aria-hidden="true" className="text-2xl">
                  {feature.icon}
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials: hidden until real beta-user quotes are added */}
        {TESTIMONIALS.length > 0 ? (
          <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              What learners say
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <figure
                  key={item.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <blockquote className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400"> · {item.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-8 px-4 pb-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Frequently asked questions
          </h2>
          <div className="mt-8">
            <FaqList items={LANDING_FAQ} />
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl bg-indigo-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-white">
              Start building learning proof today.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-indigo-100">
              Paste your first YouTube course and your streak starts now. Free.
            </p>
            <Link
              href={signedIn ? "/dashboard" : "/signup"}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-indigo-700 hover:bg-indigo-50"
            >
              {signedIn ? "Go to dashboard →" : "Start for free"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
