import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["700", "800", "900"],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(dmSans.variable, playfair.variable, "scroll-smooth")}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
