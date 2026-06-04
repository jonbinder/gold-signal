import { revalidatePath, revalidateTag } from "next/cache";
import { INVESTORS_LIST_CACHE_TAG } from "@/lib/investors/queries";

/** Bust Next.js ISR / unstable_cache for investor list and detail pages after sheet sync or admin edits. */
export function revalidateInvestorPages(slugs: string[]) {
  revalidateTag(INVESTORS_LIST_CACHE_TAG);
  revalidatePath("/investors");
  const seen = new Set<string>();
  for (const slug of slugs) {
    const normalized = slug?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    revalidateTag(`investor-${normalized}`);
    revalidatePath(`/investors/${normalized}`);
  }
}
