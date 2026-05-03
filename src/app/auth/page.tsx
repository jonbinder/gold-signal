import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign In" };

export default function AuthPage() {
  return (
    <div className="border-b border-navy-200 bg-[var(--bg-void)] py-12 sm:py-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <div className="rounded-sm border border-navy-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-sm bg-gold-500 text-lg font-black text-navy-950">
              GS
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-navy-900">Sign in to GoldSignal</h1>
            <p className="mt-2 text-sm text-slate-600">Track smart money in gold and silver</p>
          </div>

          <div className="mt-8 rounded-sm border border-dashed border-navy-300 bg-navy-50/80 px-4 py-8 text-center">
            <p className="text-sm font-medium text-navy-800">Auth integration placeholder</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Install <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">@supabase/auth-ui-react</code>{" "}
              and replace this block with your <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">&lt;Auth&gt;</code>{" "}
              component.
            </p>
          </div>

          <div className="mt-6 rounded-sm border border-navy-200 bg-navy-50 p-4 font-mono text-[11px] leading-relaxed text-slate-600">
            <span className="font-semibold text-navy-800">To enable auth:</span>
            <div className="mt-2 space-y-0.5">
              <div>npm i @supabase/auth-ui-react</div>
              <div>npm i @supabase/auth-ui-shared</div>
            </div>
            <p className="mt-3 text-slate-500">Then configure Supabase Auth in the dashboard.</p>
          </div>

          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link href="/">← Back to GoldSignal</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
