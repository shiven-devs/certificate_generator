import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { themeBootstrapScript } from "@/lib/theme/bootstrap";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Certitube",
  title: {
    default: "Certitube",
    template: "%s · Certitube",
  },
  description:
    "Watch YouTube courses in a focused player, track your study habit, and share a profile page with your consistency and completed lectures.",
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
