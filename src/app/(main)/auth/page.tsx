import type { Metadata } from "next";
import { AuthLoginForm } from "@/app/(main)/auth/AuthLoginForm";
import "./auth-page.css";

const pageDescription =
  "Sign in to GoldSignal.ai. Track SEC Form 4 insider activity and portfolio holdings in gold and silver.";

export const metadata: Metadata = {
  title: "Sign In — GoldSignal.ai",
  description: pageDescription,
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return (
    <div className="auth-page">
      <AuthLoginForm />
    </div>
  );
}
