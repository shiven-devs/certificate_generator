import Link from "next/link";
import type { Metadata } from "next";
import { resolveSession } from "@/lib/auth/session";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SUPPORT_EMAIL } from "@/lib/support";
import {
  FOUNDER,
  SITE_NAME,
  absoluteUrl,
  marketingMetadata,
  organizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = marketingMetadata({
  title: "Contact CertiTube – Questions, Feedback & Bug Reports",
  description: `Get in touch with CertiTube. Email ${SUPPORT_EMAIL} with questions, feedback, or bug reports, or find the project on GitHub.`,
  path: "/contact",
});

function contactJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: absoluteUrl("/contact"),
    mainEntity: organizationJsonLd(),
  };
}

export default async function ContactPage() {
  const session = await resolveSession();
  const signedIn = session.status === "authenticated";
  const githubLabel = FOUNDER.githubUrl.replace(/^https:\/\//, "");

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(contactJsonLd()) }}
      />
      <MarketingHeader signedIn={signedIn} />

      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Contact us</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-slate-50">
          Get in touch
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
          Questions, feedback, or found a bug? We&apos;d like to hear from you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
          >
            <span aria-hidden="true" className="text-2xl">
              ✉️
            </span>
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Email
            </h2>
            <p className="mt-1 text-sm break-all text-indigo-700 group-hover:underline dark:text-indigo-400">
              {SUPPORT_EMAIL}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              For support, feedback, bug reports, and anything else.
            </p>
          </a>

          <a
            href={FOUNDER.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
          >
            <span aria-hidden="true" className="text-2xl">
              💻
            </span>
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              GitHub
            </h2>
            <p className="mt-1 text-sm break-all text-indigo-700 group-hover:underline dark:text-indigo-400">
              {githubLabel} ↗
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Follow the work of {FOUNDER.name}, the founder of {SITE_NAME}.
            </p>
          </a>
        </div>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Looking for a quick answer?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Most questions about progress tracking, playlists, streaks, and public
            profiles are answered in the{" "}
            <Link
              href="/#faq"
              className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
            >
              FAQ
            </Link>{" "}
            and on{" "}
            <Link
              href="/how-it-works"
              className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
            >
              How it works
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
