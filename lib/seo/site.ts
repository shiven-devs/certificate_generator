import type { Metadata } from "next";
import { configuredPublicOrigin } from "@/lib/http/public-origin";
import { SUPPORT_EMAIL } from "@/lib/support";

export const SITE_NAME = "CertiTube";

export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "CertiTube: track your YouTube learning and prove it",
  type: "image/png",
} as const;

/** Absolute URL on the public origin, for JSON-LD, sitemap and robots. */
export function absoluteUrl(path = "/"): string {
  return `${configuredPublicOrigin()}${path === "/" ? "" : path}`;
}

/**
 * Full metadata for an indexable marketing page. Open Graph and Twitter are
 * replaced wholesale by the deepest segment that sets them, so every page
 * spells out its image instead of relying on the root layout.
 */
export function marketingMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: input.title,
      description: input.description,
      url: input.path,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

/**
 * JSON-LD for a <script type="application/ld+json"> body. Escaping "<" keeps
 * user-supplied names from closing the script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\u003c");
}

export const FOUNDER = {
  name: "Shiven Kumar",
  githubUrl: "https://github.com/shiven-devs",
} as const;

export function founderJsonLd() {
  return {
    "@type": "Person",
    name: FOUNDER.name,
    jobTitle: "Founder",
    sameAs: [FOUNDER.githubUrl],
  };
}

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    founder: founderJsonLd(),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      url: absoluteUrl("/contact"),
    },
  };
}
