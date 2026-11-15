import Link from "next/link";
import type { Metadata } from "next";
import { resolveSession } from "@/lib/auth/session";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  FOUNDER,
  SITE_NAME,
  absoluteUrl,
  marketingMetadata,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = marketingMetadata({
  title: "About CertiTube – Making Self-Learning on YouTube Visible",
  description:
    "CertiTube helps self-learners turn YouTube videos and playlists into tracked courses, build a consistent study habit, and show what they've learned. Built by Shiven Kumar.",
  path: "/about",
});

const BELIEFS = [
  {
    title: "Consistency beats intensity",
    body: "A daily streak and a year-long heatmap reward showing up, not cramming. Small sessions add up.",
  },
  {
    title: "Progress should be honest",
    body: "CertiTube credits the time you actually spend watching. A lesson completes at 75% credited watch time, not when you press play.",
  },
  {
    title: "Self-learning deserves proof",
    body: "Your public profile shows your stats, heatmap, and completed courses in one link. You decide what appears on it.",
  },
] as const;

function aboutJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: absoluteUrl("/about"),
    mainEntity: organizationJsonLd(),
  };
}

export default async function AboutPage() {
  const session = await resolveSession();
  const signedIn = session.status === "authenticated";

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd()) }}
      />
      <MarketingHeader signedIn={signedIn} />

      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">About us</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-slate-50">
          Making self-learning on YouTube visible.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
          YouTube holds some of the best free lectures and tutorials in the world, but
          learning from it leaves no record. {SITE_NAME} gives that learning
          structure: any educational video or playlist becomes a personal course,
          your real watch time is credited, and your consistency builds into a
          profile you can share.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Our mission
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Help self-learners study consistently and prove what they have taught
            themselves. {SITE_NAME} is free, and it is built for students, career
            switchers, and anyone using YouTube as their classroom.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            What we believe
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {BELIEFS.map((belief) => (
              <article
                key={belief.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {belief.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {belief.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Who builds {SITE_NAME}
          </h2>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white"
            >
              {FOUNDER.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {FOUNDER.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Founder. Designs, builds, and runs {SITE_NAME} solo.
              </p>
            </div>
            <a
              href={FOUNDER.githubUrl}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              GitHub ↗
            </a>
          </div>
        </section>

        <div className="mt-16 flex flex-col gap-3 sm:flex-row">
          <Link
            href={signedIn ? "/dashboard" : "/signup"}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {signedIn ? "Go to dashboard →" : "Start for free"}
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
