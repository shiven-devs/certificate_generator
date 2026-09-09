import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { themeBootstrapScript } from "@/lib/theme/bootstrap";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WatchProof",
    template: "%s · WatchProof",
  },
  description:
    "Watch YouTube courses in-app with a real 1.5x speed cap and earn a certificate after genuine completion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Script
          id="watchproof-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
