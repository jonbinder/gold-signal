import "./globals.css";

import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  weight: ["400", "500"],
  display: "swap",
});

const siteDescription =
  "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios and more.";

export const metadata: Metadata = {
  title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "GoldSignal.ai",
    title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
    description: siteDescription,
    url: "https://goldsignal.ai/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(dmSans.variable, playfair.variable, dmMono.variable, "scroll-smooth")}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
