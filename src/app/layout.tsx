import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-var",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-var",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
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
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
