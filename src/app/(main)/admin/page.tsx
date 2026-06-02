import type { Metadata } from "next";
import {
  bulkPublishDraftsAction,
  deleteInvestorAction,
  deletePositionAction,
  logoutAdminAction,
  saveInvestorAction,
  savePositionAction,
} from "@/app/(main)/admin/actions";
import { requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseServiceClient } from "@/lib/supabase";
import "@/app/funds.css";

export const metadata: Metadata = {
  title: "Admin — GoldSignal.ai",
  robots: { index: false, follow: false },
};

type InvestorOption = { id: string; slug: string; name: string; investor_type: string | null };
type PositionRow = {
  id: string;
  investor_id: string;
  ticker: string;
  company_name: string;
  position_type: string;
  detail: string;
  approx_size: string | null;
  source_type: string;
  source_detail: string;
  as_of_date: string;
  why_interesting: string | null;
  is_published: boolean;
  needs_review: boolean;
  investor?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

async function loadAdminData(filter: "all" | "drafts") {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY required for admin.");
  }
  let investorsQuery = supabase
    .from("investors")
    .select(
      "id, slug, name, investor_type, title_role, bio, photo_url, website, cik, focus_note, sort_order, is_published, needs_review",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  let positionsQuery = supabase
    .from("investor_positions")
    .select(
      "id, investor_id, ticker, company_name, position_type, detail, approx_size, source_type, source_detail, as_of_date, why_interesting, is_published, needs_review, investor:investors(name, slug)",
    )
    .order("as_of_date", { ascending: false })
    .limit(240);
  if (filter === "drafts") {
    investorsQuery = investorsQuery.eq("is_published", false).eq("needs_review", true);
    positionsQuery = positionsQuery.eq("is_published", false).eq("needs_review", true);
  }

  const [{ data: investors }, { data: positions }] = await Promise.all([investorsQuery, positionsQuery]);
  return {
    investors: (investors ?? []) as Array<{
      id: string;
      slug: string;
      name: string;
      investor_type: string | null;
      title_role: string | null;
      bio: string | null;
      photo_url: string | null;
      website: string | null;
      cik: string | null;
      focus_note: string | null;
      sort_order: number | null;
      is_published: boolean | null;
      needs_review: boolean | null;
    }>,
    positions: (positions ?? []) as PositionRow[],
  };
}

function investorJoinName(row: PositionRow): string {
  const raw = row.investor;
  const inv = Array.isArray(raw) ? raw[0] : raw;
  return inv?.name ?? row.investor_id;
}

const POSITION_TYPE_OPTIONS = [
  "stake_filing",
  "insider_form4",
  "fund_13f",
  "fund_holding",
  "public_statement",
  "other_disclosure",
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const filter = params.view === "all" ? "all" : "drafts";
  const { investors, positions } = await loadAdminData(filter);
  const investorOptions: InvestorOption[] = investors.map((i) => ({
    id: i.id,
    slug: i.slug,
    name: i.name,
    investor_type: i.investor_type,
  }));

  return (
    <main className="funds-page">
      <header className="funds-hero">
        <div className="funds-hero__inner">
          <p className="funds-hero__eyebrow">Private admin</p>
          <h1 className="funds-hero__title">Investor curation</h1>
          <p className="funds-hero__sub">
            Add/edit investors and sourced positions. Source type, source detail, and as-of date are required.
          </p>
          <p className="funds-hero__sub" style={{ marginTop: "0.35rem" }}>
            Showing {filter === "drafts" ? "draft review queue (unpublished + needs review)" : "all records"}.
          </p>
          <p className="funds-hero__sub" style={{ marginTop: "0.35rem" }}>
            View:{" "}
            <a href="/admin?view=drafts">Drafts only</a> ·{" "}
            <a href="/admin?view=all">All records</a>
          </p>
          <form action={logoutAdminAction} style={{ marginTop: "0.75rem" }}>
            <button type="submit" className="btn btn--secondary">
              Log out
            </button>
          </form>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <form action={bulkPublishDraftsAction}>
              <input type="hidden" name="kind" value="investors" />
              <button type="submit" className="btn btn--secondary">
                Bulk publish draft investors
              </button>
            </form>
            <form action={bulkPublishDraftsAction}>
              <input type="hidden" name="kind" value="positions" />
              <button type="submit" className="btn btn--secondary">
                Bulk publish draft positions
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="funds-main">
        <section className="funds-card" style={{ marginBottom: "1rem" }}>
          <h2 className="funds-card__name" style={{ marginBottom: "0.75rem" }}>
            Add investor
          </h2>
          <form action={saveInvestorAction} className="funds-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              <div className="funds-toolbar__label">Slug</div>
              <input name="slug" required />
            </label>
            <label>
              <div className="funds-toolbar__label">Name</div>
              <input name="name" required />
            </label>
            <label>
              <div className="funds-toolbar__label">Type</div>
              <select name="type" defaultValue="individual">
                <option value="individual">individual</option>
                <option value="fund">fund</option>
              </select>
            </label>
            <label>
              <div className="funds-toolbar__label">Title/role</div>
              <input name="title_role" />
            </label>
            <label>
              <div className="funds-toolbar__label">CIK (optional)</div>
              <input name="cik" />
            </label>
            <label>
              <div className="funds-toolbar__label">Sort order</div>
              <input type="number" name="sort_order" defaultValue={100} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <div className="funds-toolbar__label">Focus note</div>
              <input name="focus_note" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <div className="funds-toolbar__label">Bio</div>
              <textarea name="bio" rows={2} />
            </label>
            <label>
              <div className="funds-toolbar__label">Photo URL</div>
              <input name="photo_url" />
            </label>
            <label>
              <div className="funds-toolbar__label">Website</div>
              <input name="website" />
            </label>
            <label style={{ alignSelf: "end" }}>
              <input type="checkbox" name="is_published" defaultChecked /> Published
            </label>
            <label style={{ alignSelf: "end" }}>
              <input type="checkbox" name="needs_review" /> Needs review
            </label>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn--cta">
                Save investor
              </button>
            </div>
          </form>
        </section>

        <section className="funds-card" style={{ marginBottom: "1rem" }}>
          <h2 className="funds-card__name" style={{ marginBottom: "0.75rem" }}>
            Add sourced position
          </h2>
          <form action={savePositionAction} className="funds-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              <div className="funds-toolbar__label">Investor</div>
              <select name="investor_id" required>
                <option value="">Select investor</option>
                {investorOptions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.investor_type ?? "fund"})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div className="funds-toolbar__label">Ticker</div>
              <input name="ticker" required />
            </label>
            <label>
              <div className="funds-toolbar__label">Company</div>
              <input name="company_name" required />
            </label>
            <label>
              <div className="funds-toolbar__label">Position type</div>
              <select name="position_type" required defaultValue="public_statement">
                {POSITION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <div className="funds-toolbar__label">Detail</div>
              <textarea name="detail" rows={2} required />
            </label>
            <label>
              <div className="funds-toolbar__label">Approx size (optional, only if sourced)</div>
              <input name="approx_size" />
            </label>
            <label>
              <div className="funds-toolbar__label">As-of date (required)</div>
              <input type="date" name="as_of_date" required />
            </label>
            <label>
              <div className="funds-toolbar__label">Source type (required)</div>
              <input name="source_type" required placeholder="SEC 13G / Interview / Podcast..." />
            </label>
            <label>
              <div className="funds-toolbar__label">Source detail + URL (required)</div>
              <input name="source_detail" required placeholder="Outlet + link or filing name" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <div className="funds-toolbar__label">Why interesting (optional)</div>
              <textarea name="why_interesting" rows={2} />
            </label>
            <label style={{ alignSelf: "end" }}>
              <input type="checkbox" name="is_published" defaultChecked /> Published
            </label>
            <label style={{ alignSelf: "end" }}>
              <input type="checkbox" name="needs_review" /> Needs review
            </label>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn--cta">
                Save position
              </button>
            </div>
          </form>
        </section>

        <section className="funds-card" style={{ marginBottom: "1rem" }}>
          <h2 className="funds-card__name" style={{ marginBottom: "0.75rem" }}>
            Existing investors
          </h2>
          <div className="funds-table-wrap">
            <table className="funds-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Type</th>
                  <th>Published</th>
                  <th>Needs review</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.name}</td>
                    <td className="mono">{inv.slug}</td>
                    <td>{inv.investor_type ?? "fund"}</td>
                    <td>{inv.is_published ? "Yes" : "No"}</td>
                    <td>{inv.needs_review ? "Yes" : "No"}</td>
                    <td>
                      <details>
                        <summary className="mono">edit</summary>
                        <form action={saveInvestorAction} style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
                          <input type="hidden" name="id" value={inv.id} />
                          <input name="slug" defaultValue={inv.slug} required />
                          <input name="name" defaultValue={inv.name} required />
                          <select name="type" defaultValue={inv.investor_type ?? "fund"}>
                            <option value="individual">individual</option>
                            <option value="fund">fund</option>
                          </select>
                          <input name="title_role" defaultValue={inv.title_role ?? ""} placeholder="title/role" />
                          <input name="cik" defaultValue={inv.cik ?? ""} placeholder="CIK" />
                          <input name="focus_note" defaultValue={inv.focus_note ?? ""} placeholder="focus note" />
                          <input name="photo_url" defaultValue={inv.photo_url ?? ""} placeholder="photo URL" />
                          <input name="website" defaultValue={inv.website ?? ""} placeholder="website" />
                          <textarea name="bio" defaultValue={inv.bio ?? ""} rows={2} />
                          <input type="number" name="sort_order" defaultValue={inv.sort_order ?? 100} />
                          <label>
                            <input type="checkbox" name="is_published" defaultChecked={inv.is_published ?? false} /> published
                          </label>
                          <label>
                            <input type="checkbox" name="needs_review" defaultChecked={inv.needs_review ?? false} /> needs review
                          </label>
                          <button type="submit" className="btn btn--secondary">Update</button>
                        </form>
                      </details>
                    </td>
                    <td>
                      <form action={deleteInvestorAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <button type="submit" className="btn btn--secondary">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="funds-card">
          <h2 className="funds-card__name" style={{ marginBottom: "0.75rem" }}>
            Existing positions
          </h2>
          <div className="funds-table-wrap">
            <table className="funds-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Ticker</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>As-of</th>
                  <th>Published</th>
                  <th>Needs review</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id}>
                    <td>{investorJoinName(pos)}</td>
                    <td className="mono">{pos.ticker}</td>
                    <td>{pos.position_type}</td>
                    <td>{pos.source_type}</td>
                    <td className="mono">{pos.as_of_date}</td>
                    <td>{pos.is_published ? "Yes" : "No"}</td>
                    <td>{pos.needs_review ? "Yes" : "No"}</td>
                    <td>
                      <details>
                        <summary className="mono">edit</summary>
                        <form action={savePositionAction} style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
                          <input type="hidden" name="id" value={pos.id} />
                          <select name="investor_id" defaultValue={pos.investor_id} required>
                            {investorOptions.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name}
                              </option>
                            ))}
                          </select>
                          <input name="ticker" defaultValue={pos.ticker} required />
                          <input name="company_name" defaultValue={pos.company_name} required />
                          <select name="position_type" defaultValue={pos.position_type}>
                            {POSITION_TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <textarea name="detail" rows={2} defaultValue={pos.detail} required />
                          <input name="approx_size" defaultValue={pos.approx_size ?? ""} />
                          <input name="source_type" defaultValue={pos.source_type} required />
                          <input name="source_detail" defaultValue={pos.source_detail} required />
                          <input type="date" name="as_of_date" defaultValue={pos.as_of_date} required />
                          <textarea name="why_interesting" rows={2} defaultValue={pos.why_interesting ?? ""} />
                          <label>
                            <input type="checkbox" name="is_published" defaultChecked={pos.is_published} /> published
                          </label>
                          <label>
                            <input type="checkbox" name="needs_review" defaultChecked={pos.needs_review} /> needs review
                          </label>
                          <button type="submit" className="btn btn--secondary">Update</button>
                        </form>
                      </details>
                    </td>
                    <td>
                      <form action={deletePositionAction}>
                        <input type="hidden" name="id" value={pos.id} />
                        <button type="submit" className="btn btn--secondary">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
