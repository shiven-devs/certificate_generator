import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { themeBootstrapScript } from "@/lib/theme/bootstrap";
import { configuredPublicOrigin } from "@/lib/http/public-origin";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Watch YouTube courses in a focused player, track your study habit, and share a profile page with your consistency and completed lectures.";

export const metadata: Metadata = {
  // Social crawlers need absolute URLs, so relative image paths resolve here.
  metadataBase: new URL(configuredPublicOrigin()),
  applicationName: "Certitube",
  title: {
    default: "Certitube",
    template: "%s · Certitube",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Certitube",
    title: "Certitube",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Certitube",
    description: SITE_DESCRIPTION,
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
