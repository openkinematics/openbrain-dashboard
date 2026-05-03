import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Orbitron } from "next/font/google";
import { MobileDock } from "@/components/mobile-dock";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { MARKETING_URL } from "@/lib/env";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: {
    default: "OpenBrain Dashboard",
    template: "%s · OpenBrain",
  },
  description:
    "The Next.js web dashboard for any robot running openbrain-ros — teleop, missions, health, fleet.",
  metadataBase: new URL(MARKETING_URL),
  applicationName: "OpenBrain Dashboard",
  authors: [{ name: "OpenKinematics", url: MARKETING_URL }],
  openGraph: {
    title: "OpenBrain Dashboard",
    description: "Web dashboard for the OpenBrain robotics stack.",
    url: "/",
    siteName: "OpenBrain",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${orbitron.variable}`}
      style={
        {
          "--font-geist": "var(--font-geist-sans)",
          "--font-geist-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
    >
      <body className="font-geist min-h-dvh antialiased">
        <Providers>
          <SiteNav />
          <main className="mx-auto w-full max-w-screen-2xl min-w-0 overflow-x-hidden pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))] md:pb-14">
            {children}
            <SiteFooter />
          </main>
          <MobileDock />
        </Providers>
      </body>
    </html>
  );
}
