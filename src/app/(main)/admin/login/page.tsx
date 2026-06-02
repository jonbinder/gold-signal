import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthenticated, isAdminEnabled } from "@/lib/admin-auth";
import { loginAdminAction } from "@/app/(main)/admin/actions";

export const metadata: Metadata = {
  title: "Admin login — GoldSignal.ai",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAdminEnabled()) {
    return (
      <main className="funds-page">
        <div className="funds-main">
          <p className="funds-empty">
            Admin login is disabled. Set <code>ADMIN_PASSWORD</code> in env.
          </p>
        </div>
      </main>
    );
  }
  if (await isAdminAuthenticated()) {
    return (
      <main className="funds-page">
        <div className="funds-main">
          <p className="funds-empty">
            Already logged in. Open <Link href="/admin">/admin</Link>.
          </p>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <main className="funds-page">
      <div className="funds-main" style={{ maxWidth: "32rem" }}>
        <h1 className="funds-hero__title" style={{ color: "var(--navy-900)", marginBottom: "1rem" }}>
          Admin login
        </h1>
        <form action={loginAdminAction} className="funds-card">
          <p className="funds-card__meta" style={{ marginBottom: "0.75rem" }}>
            Private curation area for investors and sourced positions.
          </p>
          <label className="stocks-list-toolbar__group" style={{ width: "100%" }}>
            <span className="stocks-list-toolbar__label">Password</span>
            <input
              type="password"
              name="password"
              required
              className="stocks-list-toolbar__select"
              style={{ width: "100%" }}
            />
          </label>
          {hasError ? (
            <p className="funds-empty" style={{ textAlign: "left", padding: "0.5rem 0", color: "var(--red)" }}>
              Invalid password.
            </p>
          ) : null}
          <button type="submit" className="btn btn--cta" style={{ marginTop: "1rem" }}>
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
