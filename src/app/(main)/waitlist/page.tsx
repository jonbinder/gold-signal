import type { Metadata } from "next";
import { WaitlistSignup } from "@/app/(main)/waitlist/WaitlistSignup";
import "./waitlist-page.css";

const pageTitle = "Join the Waitlist — GoldSignal.ai";
const pageDescription =
  "Get early access to GoldSignal.ai. Track what elite precious metals investors own, sourced from SEC filings and fund disclosures.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: "https://goldsignal.ai/waitlist" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/waitlist",
  },
};

export default function WaitlistPage() {
  return <WaitlistSignup />;
}
