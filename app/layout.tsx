import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { themeBootstrapScript } from "@/lib/theme/bootstrap";
import { configuredPublicOrigin } from "@/lib/http/public-origin";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Turn any YouTube video or playlist into a tracked course. CertiTube credits your watch time, builds a daily streak, and gives you a shareable public learning profile. Free.";

export const metadata: Metadata = {
  // Social crawlers need absolute URLs, so relative image paths resolve here.
  metadataBase: new URL(configuredPublicOrigin()),
  applicationName: "CertiTube",
  title: {
    default: "CertiTube",
    template: "%s · CertiTube",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "CertiTube",
    title: "CertiTube",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "CertiTube",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Script
          id="certitube-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <ThemeProvider>
          <div className="flex min-h-full flex-1 flex-col">
            {children}
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
