import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GoldSignal — Smart Money in Gold & Silver",
    template: "%s | GoldSignal",
  },
  description:
    "Track what top gold and silver fund managers are buying and selling. 13F holdings intelligence for precious metals investors.",
  keywords: ["gold stocks", "silver stocks", "mining stocks", "fund managers", "13F holdings", "precious metals"],
  openGraph: {
    type: "website",
    siteName: "GoldSignal",
    title: "GoldSignal — Smart Money in Gold & Silver",
    description: "Track what top fund managers own in gold and silver miners.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, "scroll-smooth")}>
      <body className="min-h-dvh bg-[var(--bg-void)] font-sans text-[var(--text-primary)] antialiased">
        <Navbar />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
