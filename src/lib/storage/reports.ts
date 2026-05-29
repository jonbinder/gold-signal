import { createSupabaseServiceClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORTS_BUCKET = "reports";
const SIGNED_URL_TTL_SEC = 30 * 24 * 60 * 60;
const REPORTS_FILE_SIZE_LIMIT = 10 * 1024 * 1024;

function isBucketNotFoundError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("bucket not found") || lower.includes("bucket does not exist");
}

/**
 * Uploads PDF to storage; creates the reports bucket once if missing, then retries.
 */
async function uploadPdfWithBucketCheck(
  supabase: SupabaseClient,
  submissionId: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const path = `${submissionId}/signalscore-report.pdf`;

  const attemptUpload = async () =>
    supabase.storage.from(REPORTS_BUCKET).upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  let { error } = await attemptUpload();

  if (error && isBucketNotFoundError(error.message)) {
    console.warn("[processor] Bucket missing, attempting to create", { bucket: REPORTS_BUCKET });
    const { error: createError } = await supabase.storage.createBucket(REPORTS_BUCKET, {
      public: false,
      fileSizeLimit: REPORTS_FILE_SIZE_LIMIT,
      allowedMimeTypes: ["application/pdf"],
    });
    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(`PDF bucket creation failed: ${createError.message}`);
    }
    ({ error } = await attemptUpload());
    if (error) {
      throw new Error(`PDF upload failed after bucket creation: ${error.message}`);
    }
  } else if (error) {
    throw new Error(`PDF upload failed: ${error.message}`);
  }

  return path;
}

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

  const storagePath = await uploadPdfWithBucketCheck(supabase, submissionId, pdfBuffer);
  console.info("[processor] Uploaded PDF", { submissionId, path: storagePath });

  const { data: signed, error: signError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);

  if (signError || !signed?.signedUrl) {
    throw new Error(`Signed URL failed: ${signError?.message ?? "unknown"}`);
  }

  return { path: storagePath, signedUrl: signed.signedUrl };
}
