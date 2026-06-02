import "./globals.css";
import "./mobile.css";

import type { Metadata } from "next";
import { Fraunces, Inter_Tight, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["600"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-reading-loaded",
  weight: ["400", "500"],
  display: "swap",
});

const siteDescription =
  "See what the smart money is doing in gold and silver — insider buys, large stakes, and institutional moves from public SEC filings.";

export const metadata: Metadata = {
  title: "GoldSignal.ai — Smart Money in Gold & Silver",
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "GoldSignal.ai",
    title: "GoldSignal.ai — Smart Money in Gold & Silver",
    description: siteDescription,
    url: "https://goldsignal.ai/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(interTight.variable, fraunces.variable, newsreader.variable, "scroll-smooth")}
    >
      <body>{children}</body>
    </html>
  );
}
