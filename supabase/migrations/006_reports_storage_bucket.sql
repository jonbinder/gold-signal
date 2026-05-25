-- Private bucket for SignalScore PDF reports (service role uploads via API)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service role can manage all objects in reports bucket
create policy "service_role_reports_all"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'reports')
  with check (bucket_id = 'reports');
