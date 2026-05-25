-- Allow portfolio form to insert via anon key when service role is unavailable on the server.
-- Rate limiting uses a SECURITY DEFINER function (no broad SELECT on submissions).

CREATE POLICY "anon_insert_submissions"
  ON public.submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.count_submissions_last_hour(p_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.submissions
  WHERE lower(email) = lower(trim(p_email))
    AND created_at > now() - interval '1 hour';
$$;

REVOKE ALL ON FUNCTION public.count_submissions_last_hour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_submissions_last_hour(text) TO anon;
GRANT EXECUTE ON FUNCTION public.count_submissions_last_hour(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_submissions_last_hour(text) TO service_role;
