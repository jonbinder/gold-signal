import { createSupabaseServiceClient } from "@/lib/supabase";

export const REPORTS_BUCKET = "reports";
const SIGNED_URL_TTL_SEC = 30 * 24 * 60 * 60;

/**
 * Uploads a PDF to Supabase Storage and returns a 30-day signed download URL.
 */
export async function uploadReportPdf(
  submissionId: string,
  pdfBuffer: Buffer,
): Promise<{ path: string; signedUrl: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const storagePath = `${submissionId}/signalscore-report.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`PDF upload failed: ${uploadError.message}`);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);

  if (signError || !signed?.signedUrl) {
    throw new Error(`Signed URL failed: ${signError?.message ?? "unknown"}`);
  }

  return { path: storagePath, signedUrl: signed.signedUrl };
}
