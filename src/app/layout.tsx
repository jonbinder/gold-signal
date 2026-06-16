import "./globals.css";
import "./mobile.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
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
    <html lang="en" className={cn(inter.variable, "scroll-smooth")}>
      <body>{children}</body>
    </html>
  );
}
