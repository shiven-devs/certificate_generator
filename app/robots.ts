import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Social crawlers (Twitterbot, LinkedInBot) obey robots.txt, so the
      // profile share-card images under /api/og/ must stay fetchable.
      allow: ["/", "/u/", "/api/og/"],
      disallow: [
        "/dashboard",
        "/profile",
        "/courses/",
        "/certificates",
        "/admin",
        "/api/",
        "/blog/new",
        "/blog/*/edit",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
