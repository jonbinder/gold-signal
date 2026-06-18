"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { INVESTORS_LIST_CACHE_TAG } from "@/lib/investors/queries";
import { bumpInvestorPortfolioUpdatedAt } from "@/lib/investors/last-updated";
import { redirect } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { loginAdmin, logoutAdmin, requireAdminPage } from "@/lib/admin-auth";

function serviceClientOrThrow() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for /admin actions.");
  }
  return supabase;
}

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();
  const ok = await loginAdmin(password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export async function logoutAdminAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function saveInvestorAction(formData: FormData) {
  await requireAdminPage();
  const supabase = serviceClientOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "individual").trim() as "individual" | "fund";
  const titleRole = String(formData.get("title_role") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const cikRaw = String(formData.get("cik") ?? "").trim();
  const cik = cikRaw ? cikRaw.replace(/\D/g, "") : null;
  const focusNote = String(formData.get("focus_note") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") ?? 100) || 100;
  const isPublished = formData.get("is_published") === "on";
  const needsReview = formData.get("needs_review") === "on";

  if (!slug || !name) throw new Error("Investor slug and name are required.");
  if (type !== "individual" && type !== "fund") throw new Error("Invalid investor type.");

  const payload = {
    slug,
    name,
    investor_type: type,
    title_role: titleRole,
    bio,
    photo_url: photoUrl,
    website,
    website_url: website,
    cik,
    focus_note: focusNote,
    sort_order: sortOrder,
    is_published: isPublished,
    needs_review: needsReview,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("investors").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("investors").upsert(payload, { onConflict: "slug" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/portfolios");
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
  revalidatePath("/stocks");
}

export async function deleteInvestorAction(formData: FormData) {
  await requireAdminPage();
  const supabase = serviceClientOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing investor id.");
  const { error } = await supabase.from("investors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/portfolios");
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
}

export async function savePositionAction(formData: FormData) {
  await requireAdminPage();
  const supabase = serviceClientOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  const investorId = String(formData.get("investor_id") ?? "").trim();
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const positionType = String(formData.get("position_type") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const approxSize = String(formData.get("approx_size") ?? "").trim() || null;
  const sourceType = String(formData.get("source_type") ?? "").trim();
  const sourceDetail = String(formData.get("source_detail") ?? "").trim();
  const asOfDate = String(formData.get("as_of_date") ?? "").trim();
  const whyInteresting = String(formData.get("why_interesting") ?? "").trim() || null;
  const isPublished = formData.get("is_published") === "on";
  const needsReview = formData.get("needs_review") === "on";

  if (!investorId || !ticker || !companyName || !positionType || !detail) {
    throw new Error("Investor, ticker, company, type, and detail are required.");
  }
  if (!sourceType || !sourceDetail || !asOfDate) {
    throw new Error("Source type, source detail, and as-of date are required.");
  }

  const payload = {
    investor_id: investorId,
    ticker,
    company_name: companyName,
    position_type: positionType,
    detail,
    approx_size: approxSize,
    source_type: sourceType,
    source_detail: sourceDetail,
    as_of_date: asOfDate,
    why_interesting: whyInteresting,
    is_published: isPublished,
    needs_review: needsReview,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("investor_positions").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("investor_positions").insert({
      ...payload,
      google_sheet_synced: false,
    });
    if (error) throw new Error(error.message);
  }

  await bumpInvestorPortfolioUpdatedAt(supabase, investorId);

  revalidatePath("/admin");
  revalidatePath("/portfolios");
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
  revalidatePath("/stocks");
}

export async function bulkPublishDraftsAction(formData: FormData) {
  await requireAdminPage();
  const supabase = serviceClientOrThrow();
  const kind = String(formData.get("kind") ?? "positions");

  if (kind === "investors") {
    const { error } = await supabase
      .from("investors")
      .update({ is_published: true, needs_review: false, updated_at: new Date().toISOString() })
      .eq("is_published", false)
      .eq("needs_review", true);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("investor_positions")
      .update({ is_published: true, needs_review: false, updated_at: new Date().toISOString() })
      .eq("is_published", false)
      .eq("needs_review", true);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/portfolios");
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
  revalidatePath("/stocks");
}

export async function deletePositionAction(formData: FormData) {
  await requireAdminPage();
  const supabase = serviceClientOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing position id.");
  const { data: row } = await supabase
    .from("investor_positions")
    .select("investor_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("investor_positions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (row?.investor_id) {
    await bumpInvestorPortfolioUpdatedAt(supabase, row.investor_id as string);
  }
  revalidatePath("/admin");
  revalidatePath("/portfolios");
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
  revalidatePath("/stocks");
}
