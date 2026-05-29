-- Private bucket for SignalScore PDF reports (idempotent; safe if 006 was never applied)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Service role can read/write; no anonymous object access (downloads use signed URLs)
DROP POLICY IF EXISTS "service_role_reports_all" ON storage.objects;
CREATE POLICY "service_role_reports_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'reports')
  WITH CHECK (bucket_id = 'reports');
