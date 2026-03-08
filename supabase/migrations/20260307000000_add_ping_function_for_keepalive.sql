-- ==============================================
-- PING FUNCTION FOR SUPABASE KEEP-ALIVE
-- ==============================================
-- Used by the /api/supabase-activity-ping endpoint and cron
-- to prevent the free-tier project from going inactive.
-- Callable by anon so the health check works without auth.
-- ==============================================

CREATE OR REPLACE FUNCTION public.ping()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 1;
$$;

COMMENT ON FUNCTION public.ping() IS 'Keep-alive ping for Supabase activity; callable by anon.';

-- Allow anon and authenticated to call (no auth required for cron)
GRANT EXECUTE ON FUNCTION public.ping() TO anon;
GRANT EXECUTE ON FUNCTION public.ping() TO authenticated;
